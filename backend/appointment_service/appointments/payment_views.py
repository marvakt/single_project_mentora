"""
Payment views for appointment_service V1.

Handles Razorpay payment creation and webhook processing.
"""
import uuid
import logging
from decimal import Decimal
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied

from .models import Appointment, Payment
from .authentication import JWTAuthentication
from .permissions import IsAuthenticatedJWT, IsUserRole
from .utils import fetch_doctor_availability_and_fee, UserServiceError
from .razorpay_utils import create_razorpay_order, verify_razorpay_signature
from .producer import publish_appointment_paid

logger = logging.getLogger(__name__)


class PaymentCreateAPIView(APIView):
    """
    POST /appointments/{appointment_id}/payments/create

    Creates a Razorpay payment order for an appointment.
    Only authenticated users with role=user.
    Appointment must belong to the user and be in 'pending' status.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsUserRole]

    @transaction.atomic
    def post(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        # Extract user_id from JWT ONLY
        user_id = request.user_data["user_id"]
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        # Verify appointment belongs to user
        if appointment.user_id != user_uuid:
            raise PermissionDenied("Appointment does not belong to user")

        # Verify appointment status is 'pending'
        if appointment.status != "pending":
            return Response(
                {"error": "Payment can only be created for pending appointments"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if payment already exists
        if hasattr(appointment, "payment"):
            existing_payment = appointment.payment
            if existing_payment.status == "paid":
                return Response(
                    {"error": "Payment already completed"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # If payment exists but not paid, return existing order_id
            return Response(
                {
                    "razorpay_order_id": existing_payment.razorpay_order_id,
                    "amount": str(existing_payment.amount),
                    "currency": existing_payment.currency,
                },
                status=status.HTTP_200_OK
            )

        # Fetch consultation fee from user_service
        try:
            doctor_data = fetch_doctor_availability_and_fee(appointment.doctor_id)
            consultation_fee = doctor_data.get("consultation_fee")
        except UserServiceError as e:
            return Response(
                {"error": f"Failed to fetch consultation fee: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not consultation_fee:
            return Response(
                {"error": "Consultation fee not available"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Convert fee to paise (Razorpay requires smallest currency unit)
        amount_paise = int(Decimal(str(consultation_fee)) * 100)

        # Create Razorpay order
        razorpay_order_id = None
        try:
            razorpay_order = create_razorpay_order(
                amount_paise=amount_paise,
                currency="INR",
                notes={
                    "appointment_id": str(appointment.id),
                    "user_id": str(appointment.user_id),
                    "doctor_id": str(appointment.doctor_id),
                }
            )
            razorpay_order_id = razorpay_order["id"]
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            # In development, create a mock order ID if Razorpay is not configured
            import os
            if os.getenv('DJANGO_DEBUG', 'True') == 'True':
                # Generate a mock Razorpay order ID for development
                # uuid is already imported at the top of the file
                razorpay_order_id = f"order_mock_{str(uuid.uuid4()).replace('-', '')[:10]}"
                logger.info(f"Created mock Razorpay order ID for development: {razorpay_order_id}")
            else:
                return Response(
                    {"error": "Failed to create payment order"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # Check if razorpay_order_id was set
        if razorpay_order_id is None:
            return Response(
                {"error": "Failed to create payment order"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Create Payment record with status='created'
        payment = Payment.objects.create(
            appointment=appointment,
            amount=consultation_fee,
            currency="INR",
            razorpay_order_id=razorpay_order_id,
            status="created"
        )

        return Response(
            {
                "razorpay_order_id": razorpay_order_id,
                "amount": str(consultation_fee),
                "currency": "INR",
            },
            status=status.HTTP_201_CREATED
        )


class RazorpayWebhookAPIView(APIView):
    """
    POST /payments/webhook/razorpay

    Handles Razorpay payment webhook.
    Verifies signature, updates payment status, confirms appointment.
    Webhook does NOT require JWT authentication.
    """
    authentication_classes = []  # No JWT for webhook
    permission_classes = []  # No permission check for webhook

    @transaction.atomic
    def post(self, request):
        """
        Processes Razorpay payment webhook.

        Expected payload:
        {
            "razorpay_order_id": "...",
            "razorpay_payment_id": "...",
            "razorpay_signature": "...",
            "event": "payment.captured" (or similar)
        }
        """
        webhook_data = request.data

        razorpay_order_id = webhook_data.get("razorpay_order_id")
        razorpay_payment_id = webhook_data.get("razorpay_payment_id")
        razorpay_signature = webhook_data.get("razorpay_signature")

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            logger.warning("Missing required webhook fields")
            return Response(
                {"error": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify signature
        if not verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
            logger.warning(f"Invalid Razorpay signature for order: {razorpay_order_id}")
            return Response(
                {"error": "Invalid signature"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find payment by razorpay_order_id
        try:
            payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
        except Payment.DoesNotExist:
            logger.warning(f"Payment not found for order: {razorpay_order_id}")
            return Response(
                {"error": "Payment not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Idempotency check: if already paid, return success
        if payment.status == "paid":
            logger.info(f"Payment already processed: {razorpay_order_id}")
            return Response({"status": "already_processed"})

        # Update payment status
        payment.status = "paid"
        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.save(update_fields=["status", "razorpay_payment_id", "razorpay_signature"])

        # Update appointment status to 'confirmed'
        appointment = payment.appointment
        if appointment.status == "pending":
            appointment.status = "confirmed"
            appointment.save(update_fields=["status"])

            # Store event data for publishing after transaction commit
            event_data = {
                "appointment_id": str(appointment.id),
                "user_id": str(appointment.user_id),
                "doctor_id": str(appointment.doctor_id),
                "scheduled_at": appointment.scheduled_at.isoformat(),
                "payment_id": str(payment.id),
                "amount": str(payment.amount),
            }

            # Publish async event after DB commit (fail gracefully if Celery/RabbitMQ unavailable)
            # Using transaction.on_commit to ensure event is published after transaction
            def publish_event():
                try:
                    publish_appointment_paid.delay(**event_data)
                except Exception as e:
                    # Log the error but don't fail the payment processing
                    logger.error(f"Failed to publish appointment paid event: {e}")
                    # Continue without failing the webhook

            transaction.on_commit(publish_event)

        logger.info(f"Payment processed successfully: {razorpay_order_id}")
        return Response({"status": "success"})

