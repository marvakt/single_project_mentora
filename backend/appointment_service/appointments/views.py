

# """
# appointments/views.py - UPDATED WITH MEDICAL SERVICE INTEGRATION

# Secure appointment views for appointment_service V2.
# Now includes medical service integration for severity-based routing.
# """
# import uuid
# import requests
# from django.db import transaction
# from django.conf import settings
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.exceptions import NotFound, PermissionDenied

# from .models import Appointment
# from .serializers import AppointmentCreateSerializer
# from .authentication import JWTAuthentication
# from .permissions import IsAuthenticatedJWT, IsUserRole, IsDoctorRole
# from .utils import (
#     is_valid_status_transition,
#     fetch_doctor_availability_and_fee,
#     fetch_user_severity_level,
#     UserServiceError,
#     MedicalServiceError,
# )
# from .producer import (
#     publish_appointment_created,
#     publish_appointment_cancelled,
#     publish_appointment_completed,
# )


# class AppointmentAPIView(APIView):
#     """
#     Handles POST /appointments (create) and GET /appointments (list).
    
#     Enhanced with medical service integration for severity-based routing.
#     """
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticatedJWT]

#     @transaction.atomic
#     def post(self, request):
#         """
#         POST /appointments
        
#         Creates a new appointment with severity-based priority.
#         - Fetches user's latest severity from medical_service
#         - Validates doctor availability
#         - Creates appointment with severity level
#         """
#         # Check user role
#         if request.user_data.get("role") != "user":
#             return Response(
#                 {"error": "Only users can create appointments"},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         serializer = AppointmentCreateSerializer(data=request.data)
#         if not serializer.is_valid():
#             print(f"DEBUG: Appointment creation failed. Data: {request.data}")
#             print(f"DEBUG: Serializer errors: {serializer.errors}")
#             return Response(
#                 serializer.errors,
#                 status=status.HTTP_422_UNPROCESSABLE_ENTITY
#             )

#         data = serializer.validated_data
#         user_id = request.user_data["user_id"]
#         try:
#             # Handle doctor_id being UUID string or Integer string
#             d_id_str = str(data["doctor_id"])
#             if len(d_id_str) < 32 and d_id_str.isdigit():
#                  # It's likely a legacy integer ID (e.g. "24")
#                  doctor_id = uuid.UUID(int=int(d_id_str))
#             else:
#                  # Assume it's a UUID string
#                  doctor_id = uuid.UUID(d_id_str)
#         except ValueError:
#              return Response(
#                  {"error": "Invalid doctor_id format"},
#                  status=status.HTTP_400_BAD_REQUEST
#              )

#         # Convert user_id to UUID
#         user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

#         # Fetch user's latest severity from medical_service
#         severity_data = None
#         try:
#             severity_data = fetch_user_severity_level(user_id, request.headers.get("Authorization"))
#         except MedicalServiceError as e:
#             # Non-blocking: continue without severity if medical service unavailable
#             print(f"⚠️ Medical service unavailable: {e}")

#         # Validate doctor availability
#         try:
#             doctor_data = fetch_doctor_availability_and_fee(doctor_id)
#             consultation_fee = doctor_data.get("consultation_fee")
#         except UserServiceError as e:
#             import logging
#             logger = logging.getLogger(__name__)
#             logger.error(f"UserServiceError during appointment creation: {e}")
#             return Response(
#                 {"error": str(e)},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Determine priority based on severity
#         priority = "normal"
#         severity_level = None
#         if severity_data:
#             severity_level = severity_data.get("severity_level")
#             if severity_level in ["severe", "moderately_severe"]:
#                 priority = "high"
#             elif severity_level == "moderate":
#                 priority = "medium"

#         # Check if the time slot is already booked (including pending appointments)
#         conflicting_appointments = Appointment.objects.filter(
#             doctor_id=doctor_id,
#             scheduled_at=data["scheduled_at"],
#             status__in=["pending", "confirmed"]  # Don't allow booking if there's already a pending or confirmed appointment
#         )
        
#         if conflicting_appointments.exists():
#             return Response(
#                 {"error": "This time slot is already booked. Please select another time."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         # Create appointment
#         appointment = Appointment.objects.create(
#             user_id=user_uuid,
#             doctor_id=doctor_id,
#             scheduled_at=data["scheduled_at"],
#             severity_level=data.get("severity_level") or severity_data.get("raw_score") if severity_data else None,
#             status="pending",
#             notes=data.get("notes", "")
#         )

#         # Publish event (fail gracefully if Celery/RabbitMQ unavailable)
#         try:
#             publish_appointment_created.delay(
#                 appointment_id=str(appointment.id),
#                 user_id=str(user_id),
#                 doctor_id=str(doctor_id),
#                 scheduled_at=appointment.scheduled_at.isoformat(),
#                 status=appointment.status,
#                 severity_level=severity_level,
#                 priority=priority,
#             )
#         except Exception as e:
#             # Log the error but don't fail the appointment creation
#             import logging
#             logger = logging.getLogger(__name__)
#             logger.error(f"Failed to publish appointment created event: {e}")
#             # Continue with the response even if event publishing fails

#         return Response(
#             {
#                 "appointment_id": str(appointment.id),
#                 "status": appointment.status,
#                 "consultation_fee": consultation_fee,
#                 "priority": priority,
#                 "severity_level": severity_level,
#                 "scheduled_at": appointment.scheduled_at.isoformat(),
#             },
#             status=status.HTTP_201_CREATED
#         )

#     def get(self, request):
#         """
#         GET /appointments
        
#         Lists appointments with enhanced filtering:
#         - user → own appointments with severity info
#         - doctor → assigned appointments with patient severity
#         - admin → all appointments
#         """
#         user_id = request.user_data["user_id"]
#         role = request.user_data.get("role")
#         user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

#         # Filter based on role
#         if role == "user":
#             qs = Appointment.objects.filter(user_id=user_uuid)
#         elif role == "doctor":
#             qs = Appointment.objects.filter(doctor_id=user_uuid)
#         elif role == "admin":
#             qs = Appointment.objects.all()
#         else:
#             return Response(
#                 {"error": "Invalid role"},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         qs = qs.order_by("-scheduled_at")

#         # Enhanced response with additional fields
#         appointments = []
#         for a in qs:
#             appointment_data = {
#                 "id": str(a.id),
#                 "user_id": str(a.user_id),
#                 "doctor_id": str(a.doctor_id),
#                 "scheduled_at": a.scheduled_at.isoformat(),
#                 "status": a.status,
#                 "severity_level": a.severity_level,
#                 "notes": a.notes if hasattr(a, 'notes') else "",
#                 "created_at": a.created_at.isoformat(),
#             }
            
#             # Add payment status if exists
#             if hasattr(a, 'payment'):
#                 appointment_data["payment_status"] = a.payment.status
#                 appointment_data["amount"] = str(a.payment.amount)
            
#             appointments.append(appointment_data)

#         return Response({
#             "appointments": appointments,
#             "total": len(appointments)
#         })


# class AppointmentDetailAPIView(APIView):
#     """
#     GET /appointments/{id}
    
#     Get detailed appointment information including medical context.
#     """
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticatedJWT]

#     def get(self, request, id):
#         try:
#             appointment = Appointment.objects.get(id=id)
#         except Appointment.DoesNotExist:
#             raise NotFound("Appointment not found")

#         user_id = request.user_data["user_id"]
#         role = request.user_data.get("role")
#         user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

#         # Check access permissions
#         if role == "user" and appointment.user_id != user_uuid:
#             raise PermissionDenied("Access denied")
#         elif role == "doctor" and appointment.doctor_id != user_uuid:
#             raise PermissionDenied("Access denied")

#         # Build response
#         response_data = {
#             "id": str(appointment.id),
#             "user_id": str(appointment.user_id),
#             "doctor_id": str(appointment.doctor_id),
#             "scheduled_at": appointment.scheduled_at.isoformat(),
#             "status": appointment.status,
#             "severity_level": appointment.severity_level,
#             "notes": appointment.notes if hasattr(appointment, 'notes') else "",
#             "created_at": appointment.created_at.isoformat(),
#             "updated_at": appointment.updated_at.isoformat(),
#         }

#         # Add payment info
#         if hasattr(appointment, 'payment'):
#             response_data["payment"] = {
#                 "status": appointment.payment.status,
#                 "amount": str(appointment.payment.amount),
#                 "currency": appointment.payment.currency,
#                 "razorpay_order_id": appointment.payment.razorpay_order_id,
#             }

#         # Add video session info
#         if hasattr(appointment, 'video_session'):
#             response_data["video_session"] = {
#                 "provider": appointment.video_session.provider,
#                 "session_id": appointment.video_session.session_id,
#                 "started_at": appointment.video_session.started_at.isoformat() if appointment.video_session.started_at else None,
#             }

#         # For doctors: fetch patient's medical summary
#         if role == "doctor":
#             try:
#                 medical_summary = fetch_medical_summary(
#                     str(appointment.user_id),
#                     request.headers.get("Authorization")
#                 )
#                 response_data["patient_medical_summary"] = medical_summary
#             except Exception as e:
#                 print(f"⚠️ Failed to fetch medical summary: {e}")

#         return Response(response_data)


# class AppointmentCancelAPIView(APIView):
#     """
#     POST /appointments/{id}/cancel
    
#     Cancels an appointment with proper validation.
#     """
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticatedJWT]

#     @transaction.atomic
#     def post(self, request, id):
#         try:
#             appointment = Appointment.objects.get(id=id)
#         except Appointment.DoesNotExist:
#             raise NotFound("Appointment not found")

#         user_id = request.user_data["user_id"]
#         user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

#         # Only owner can cancel
#         if appointment.user_id != user_uuid:
#             raise PermissionDenied("Only appointment owner can cancel")

#         # Validate state transition
#         if not is_valid_status_transition(appointment.status, "cancelled"):
#             return Response(
#                 {"error": f"Cannot cancel appointment with status '{appointment.status}'"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Update status
#         appointment.status = "cancelled"
#         appointment.save(update_fields=["status", "updated_at"])

#         # Publish event (fail gracefully if Celery/RabbitMQ unavailable)
#         try:
#             publish_appointment_cancelled.delay(
#                 appointment_id=str(appointment.id),
#                 user_id=str(appointment.user_id),
#                 doctor_id=str(appointment.doctor_id),
#                 scheduled_at=appointment.scheduled_at.isoformat(),
#                 status=appointment.status,
#             )
#         except Exception as e:
#             # Log the error but don't fail the appointment cancellation
#             import logging
#             logger = logging.getLogger(__name__)
#             logger.error(f"Failed to publish appointment cancelled event: {e}")
#             # Continue with the response even if event publishing fails

#         return Response({
#             "status": "cancelled",
#             "message": "Appointment cancelled successfully"
#         })


# class AppointmentCompleteAPIView(APIView):
#     """
#     POST /appointments/{id}/complete
    
#     Marks appointment as completed (Doctor only).
#     """
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticatedJWT, IsDoctorRole]

#     @transaction.atomic
#     def post(self, request, id):
#         try:
#             appointment = Appointment.objects.get(id=id)
#         except Appointment.DoesNotExist:
#             raise NotFound("Appointment not found")

#         user_id = request.user_data["user_id"]
#         user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

#         # Only assigned doctor can complete
#         if appointment.doctor_id != user_uuid:
#             raise PermissionDenied("Only assigned doctor can complete appointment")

#         # Validate state transition
#         if not is_valid_status_transition(appointment.status, "completed"):
#             return Response(
#                 {"error": f"Cannot complete appointment with status '{appointment.status}'"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Update status
#         appointment.status = "completed"
#         appointment.save(update_fields=["status", "updated_at"])

#         # Publish event (fail gracefully if Celery/RabbitMQ unavailable)
#         try:
#             publish_appointment_completed.delay(
#                 appointment_id=str(appointment.id),
#                 user_id=str(appointment.user_id),
#                 doctor_id=str(appointment.doctor_id),
#                 scheduled_at=appointment.scheduled_at.isoformat(),
#                 status=appointment.status,
#             )
#         except Exception as e:
#             # Log the error but don't fail the appointment completion
#             import logging
#             logger = logging.getLogger(__name__)
#             logger.error(f"Failed to publish appointment completed event: {e}")
#             # Continue with the response even if event publishing fails

#         return Response({
#             "status": "completed",
#             "message": "Appointment marked as completed"
#         })


# class AvailableSlotsAPIView(APIView):
#     """
#     GET /doctors/{doctor_id}/available-slots/?date={date}
    
#     Get available time slots for a specific doctor on a specific date.
#     Excludes already booked slots (pending and confirmed appointments).
#     """
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticatedJWT]
    
#     def get(self, request, doctor_id):
#         date_str = request.GET.get('date')
#         if not date_str:
#             return Response(
#                 {"error": "Date parameter is required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             # Convert date string to date object
#             from datetime import datetime
#             date = datetime.strptime(date_str, '%Y-%m-%d').date()
#         except ValueError:
#             return Response(
#                 {"error": "Invalid date format. Use YYYY-MM-DD"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             from .utils import get_available_slots_for_date
#             available_slots = get_available_slots_for_date(doctor_id, date)
            
#             return Response({
#                 "available_slots": available_slots,
#                 "date": date_str,
#                 "doctor_id": doctor_id
#             })
#         except Exception as e:
#             return Response(
#                 {"error": "Failed to fetch available slots"},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


# # Helper function to fetch medical summary
# def fetch_medical_summary(user_id: str, auth_header: str) -> dict:
#     """
#     Fetches patient's medical summary from medical_service.
#     """
#     try:
#         headers = {"Authorization": auth_header} if auth_header else {}
#         response = requests.get(
#             f"{settings.MEDICAL_SERVICE_BASE_URL}/summary/user/{user_id}",
#             headers=headers,
#             timeout=5
#         )
        
#         if response.status_code == 200:
#             return response.json()
#         return {}
#     except Exception as e:
#         print(f"Failed to fetch medical summary: {e}")
#         return {}



"""
appointments/views.py - ALL VIEWS IN ONE FILE

Clean views focused only on HTTP handling.
All business logic delegated to utils.py.
Includes: Appointment, Payment, and Video Session views.
"""
import logging
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied

from .models import Appointment
from .serializers import (
    AppointmentCreateSerializer,
    AppointmentListSerializer,
    AppointmentDetailSerializer,
    AvailableSlotsRequestSerializer,
    PaymentWebhookSerializer,
    VideoSessionCreateSerializer,
    VideoSessionUpdateSerializer,
)
from .authentication import JWTAuthentication
from .permissions import IsAuthenticatedJWT, IsUserRole, IsDoctorRole
from .utils import (
    create_appointment_with_validation,
    get_filtered_appointments,
    cancel_appointment,
    complete_appointment,
    get_available_slots_for_date,
    validate_appointment_access,
    validate_video_session_timing,
    fetch_medical_summary,
    convert_to_uuid,
    create_payment_order,
    process_payment_webhook,
    create_video_session,
    update_video_session,
    AppointmentBusinessError,
)
from .producer import (
    publish_appointment_created,
    publish_appointment_cancelled,
    publish_appointment_completed,
    publish_appointment_paid,
)

logger = logging.getLogger(__name__)


# ==================== APPOINTMENT VIEWS ====================

class AppointmentAPIView(APIView):
    """
    Handles:
    - POST /appointments (create)
    - GET /appointments (list)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def post(self, request):
        """Create new appointment."""
        # Check user role
        if request.user_data.get("role") != "user":
            return Response(
                {"error": "Only users can create appointments"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate request data
        serializer = AppointmentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Appointment validation failed: {serializer.errors}")
            return Response(
                serializer.errors,
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        data = serializer.validated_data
        user_id = request.user_data["user_id"]
        auth_header = request.headers.get("Authorization")

        # Create appointment using business logic
        try:
            appointment, priority, severity_level, consultation_fee = (
                create_appointment_with_validation(
                    user_id=user_id,
                    doctor_id=data["doctor_id"],
                    scheduled_at=data["scheduled_at"],
                    severity_level=data.get("severity_level"),
                    notes=data.get("notes", ""),
                    auth_header=auth_header
                )
            )
        except AppointmentBusinessError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Publish event (fail gracefully)
        try:
            publish_appointment_created.delay(
                appointment_id=str(appointment.id),
                user_id=str(user_id),
                doctor_id=str(appointment.doctor_id),
                scheduled_at=appointment.scheduled_at.isoformat(),
                status=appointment.status,
                severity_level=severity_level,
                priority=priority,
            )
        except Exception as e:
            logger.error(f"Failed to publish appointment created event: {e}")

        return Response(
            {
                "appointment_id": str(appointment.id),
                "status": appointment.status,
                "consultation_fee": str(consultation_fee),
                "priority": priority,
                "severity_level": severity_level,
                "scheduled_at": appointment.scheduled_at.isoformat(),
            },
            status=status.HTTP_201_CREATED
        )

    def get(self, request):
        """List appointments based on user role."""
        user_id = request.user_data["user_id"]
        role = request.user_data.get("role")

        try:
            appointments = get_filtered_appointments(user_id, role)
        except AppointmentBusinessError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AppointmentListSerializer(appointments, many=True)
        
        return Response({
            "appointments": serializer.data,
            "total": len(serializer.data)
        })


class AppointmentDetailAPIView(APIView):
    """
    Handles:
    - GET /appointments/{id}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, id):
        """Get detailed appointment information."""
        try:
            appointment = Appointment.objects.select_related(
                'payment', 'video_session'
            ).get(id=id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        user_id = request.user_data["user_id"]
        role = request.user_data.get("role")

        # Validate access
        try:
            validate_appointment_access(appointment, user_id, role)
        except AppointmentBusinessError as e:
            raise PermissionDenied(str(e))

        # Serialize appointment
        serializer = AppointmentDetailSerializer(appointment)
        response_data = serializer.data

        # For doctors: add patient's medical summary
        if role == "doctor":
            try:
                medical_summary = fetch_medical_summary(
                    str(appointment.user_id),
                    request.headers.get("Authorization")
                )
                response_data["patient_medical_summary"] = medical_summary
            except Exception as e:
                logger.warning(f"Failed to fetch medical summary: {e}")

        return Response(response_data)


class AppointmentCancelAPIView(APIView):
    """
    Handles:
    - POST /appointments/{id}/cancel
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def post(self, request, id):
        """Cancel an appointment."""
        try:
            appointment = Appointment.objects.select_for_update().get(id=id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        user_id = request.user_data["user_id"]

        # Cancel appointment using business logic
        try:
            appointment = cancel_appointment(appointment, user_id)
        except AppointmentBusinessError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Publish event (fail gracefully)
        try:
            publish_appointment_cancelled.delay(
                appointment_id=str(appointment.id),
                user_id=str(appointment.user_id),
                doctor_id=str(appointment.doctor_id),
                scheduled_at=appointment.scheduled_at.isoformat(),
                status=appointment.status,
            )
        except Exception as e:
            logger.error(f"Failed to publish appointment cancelled event: {e}")

        return Response({
            "status": "cancelled",
            "message": "Appointment cancelled successfully"
        })


class AppointmentCompleteAPIView(APIView):
    """
    Handles:
    - POST /appointments/{id}/complete
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctorRole]

    def post(self, request, id):
        """Mark appointment as completed (Doctor only)."""
        try:
            appointment = Appointment.objects.select_for_update().get(id=id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        user_id = request.user_data["user_id"]

        # Complete appointment using business logic
        try:
            appointment = complete_appointment(appointment, user_id)
        except AppointmentBusinessError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Publish event (fail gracefully)
        try:
            publish_appointment_completed.delay(
                appointment_id=str(appointment.id),
                user_id=str(appointment.user_id),
                doctor_id=str(appointment.doctor_id),
                scheduled_at=appointment.scheduled_at.isoformat(),
                status=appointment.status,
            )
        except Exception as e:
            logger.error(f"Failed to publish appointment completed event: {e}")

        return Response({
            "status": "completed",
            "message": "Appointment marked as completed"
        })


class AvailableSlotsAPIView(APIView):
    """
    Handles:
    - GET /doctors/{doctor_id}/available-slots/?date={date}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]
    
    def get(self, request, doctor_id):
        """Get available time slots for a doctor on a specific date."""
        date_str = request.GET.get('date')
        if not date_str:
            return Response(
                {"error": "Date parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate date format
        serializer = AvailableSlotsRequestSerializer(data={'date': date_str})
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        date = serializer.validated_data['date']
        
        # Convert doctor_id to UUID
        try:
            doctor_uuid = convert_to_uuid(doctor_id)
        except ValueError:
            return Response(
                {"error": "Invalid doctor_id format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get available slots
        try:
            available_slots = get_available_slots_for_date(doctor_uuid, date)
        except Exception as e:
            logger.error(f"Failed to fetch available slots: {e}")
            return Response(
                {"error": "Failed to fetch available slots"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            "available_slots": available_slots,
            "date": date_str,
            "doctor_id": doctor_id
        })


# ==================== PAYMENT VIEWS ====================

class PaymentCreateAPIView(APIView):
    """
    Handles:
    - POST /appointments/{appointment_id}/payments/create
    
    Creates Razorpay payment order for appointment.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsUserRole]

    def post(self, request, appointment_id):
        """Create payment order for appointment."""
        try:
            appointment = Appointment.objects.select_related('payment').get(
                id=appointment_id
            )
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        user_id = request.user_data["user_id"]

        # Create payment order using business logic
        try:
            razorpay_order_id, amount, currency = create_payment_order(
                appointment, user_id
            )
        except AppointmentBusinessError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "razorpay_order_id": razorpay_order_id,
                "amount": str(amount),
                "currency": currency,
            },
            status=status.HTTP_201_CREATED
        )


class RazorpayWebhookAPIView(APIView):
    """
    Handles:
    - POST /payments/webhook/razorpay
    
    Processes Razorpay payment webhook.
    No authentication required for webhooks.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        """Process Razorpay webhook."""
        # Validate webhook data
        serializer = PaymentWebhookSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Invalid webhook data: {serializer.errors}")
            return Response(
                {"error": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        # Process webhook using business logic
        try:
            with transaction.atomic():
                payment, appointment = process_payment_webhook(
                    razorpay_order_id=data["razorpay_order_id"],
                    razorpay_payment_id=data["razorpay_payment_id"],
                    razorpay_signature=data["razorpay_signature"]
                )
        except AppointmentBusinessError as e:
            if "already processed" in str(e).lower():
                return Response({"status": "already_processed"})
            
            logger.warning(f"Webhook processing failed: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Publish event after successful transaction
        event_data = {
            "appointment_id": str(appointment.id),
            "user_id": str(appointment.user_id),
            "doctor_id": str(appointment.doctor_id),
            "scheduled_at": appointment.scheduled_at.isoformat(),
            "payment_id": str(payment.id),
            "amount": str(payment.amount),
        }

        # Use transaction.on_commit to publish after DB commit
        def publish_event():
            try:
                publish_appointment_paid.delay(**event_data)
            except Exception as e:
                logger.error(f"Failed to publish appointment paid event: {e}")

        transaction.on_commit(publish_event)

        logger.info(f"Payment processed successfully: {data['razorpay_order_id']}")
        return Response({"status": "success"})


# ==================== VIDEO SESSION VIEWS ====================

class VideoSessionCreateAPIView(APIView):
    """
    Handles:
    - POST /appointments/{appointment_id}/video/create
    
    Creates video session for confirmed appointment.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def post(self, request, appointment_id):
        """Create video session for appointment."""
        try:
            appointment = Appointment.objects.select_related(
                'video_session'
            ).get(id=appointment_id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        user_id = request.user_data["user_id"]
        role = request.user_data.get("role")

        # Validate access
        try:
            validate_appointment_access(appointment, user_id, role)
        except AppointmentBusinessError as e:
            raise PermissionDenied(str(e))

        # Validate request data
        serializer = VideoSessionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        provider = serializer.validated_data.get("provider", "twilio")

        # Create video session using business logic
        try:
            video_session, token = create_video_session(
                appointment, provider, user_id, role
            )
        except AppointmentBusinessError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        message = "Video session created successfully"
        if hasattr(appointment, 'video_session') and appointment.video_session.id != video_session.id:
            message = "Video session already exists"

        return Response({
            "session_id": video_session.session_id,
            "token": token,
            "provider": video_session.provider,
            "room_name": video_session.room_name,
            "message": message
        }, status=status.HTTP_201_CREATED)


class VideoSessionDetailAPIView(APIView):
    """
    Handles:
    - GET /appointments/{appointment_id}/video/
    - PATCH /appointments/{appointment_id}/video/
    
    Get and update video session details.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, appointment_id):
        """Get video session details."""
        try:
            appointment = Appointment.objects.select_related(
                'video_session'
            ).get(id=appointment_id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        if not hasattr(appointment, 'video_session'):
            raise NotFound("Video session not found")

        user_id = request.user_data["user_id"]
        role = request.user_data.get("role")

        # Validate access
        try:
            validate_appointment_access(appointment, user_id, role)
        except AppointmentBusinessError as e:
            raise PermissionDenied(str(e))

        # Check appointment status
        if appointment.status not in ['confirmed', 'completed']:
            return Response(
                {"error": "Appointment is not in a valid status for video call"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate timing window
        is_valid_time, error_msg = validate_video_session_timing(appointment)
        if not is_valid_time:
            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )

        video_session = appointment.video_session

        # Check doctor approval for users
        if not video_session.doctor_approved and role == "user":
            return Response(
                {"error": "Video session not yet approved by doctor"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get appropriate token based on role
        token = (video_session.user_token if role == "user" 
                else video_session.doctor_token)

        from django.utils import timezone
        now = timezone.now()
        
        return Response({
            "session_id": video_session.session_id,
            "token": token,
            "provider": video_session.provider,
            "started_at": (video_session.started_at.isoformat() 
                          if video_session.started_at else None),
            "ended_at": (video_session.ended_at.isoformat() 
                        if video_session.ended_at else None),
            "is_active": video_session.is_active,
            "doctor_approved": video_session.doctor_approved,
            "room_name": video_session.room_name,
            "appointment_time": appointment.scheduled_at.isoformat(),
            "current_time": now.isoformat(),
        })

    def patch(self, request, appointment_id):
        """Update video session (approve or end)."""
        try:
            appointment = Appointment.objects.select_related(
                'video_session'
            ).get(id=appointment_id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        if not hasattr(appointment, 'video_session'):
            raise NotFound("Video session not found")

        user_id = request.user_data["user_id"]
        role = request.user_data.get("role")

        # Validate access
        try:
            validate_appointment_access(appointment, user_id, role)
        except AppointmentBusinessError as e:
            raise PermissionDenied(str(e))

        # Validate request data
        serializer = VideoSessionUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        video_session = appointment.video_session

        # Handle approval (doctor only)
        if 'approve' in data:
            if role != "doctor":
                raise PermissionDenied("Only doctor can approve video session")
            
            video_session = update_video_session(
                video_session,
                approve=data['approve']
            )
            
            return Response({
                "session_id": video_session.session_id,
                "doctor_approved": video_session.doctor_approved,
                "message": "Video session approval updated successfully"
            })

        # Handle ending session
        if data.get('ended', False):
            video_session = update_video_session(
                video_session,
                ended=True
            )

        return Response({
            "session_id": video_session.session_id,
            "is_active": video_session.is_active,
            "ended_at": (video_session.ended_at.isoformat() 
                        if video_session.ended_at else None),
            "doctor_approved": video_session.doctor_approved,
            "message": "Video session updated successfully"
        })