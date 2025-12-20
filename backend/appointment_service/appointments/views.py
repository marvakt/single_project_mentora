"""
Secure appointment views for appointment_service V1.

All endpoints validate JWT via auth_service.
Extract user_id from JWT ONLY - never trust request body/query params.
Enforce RBAC: user, doctor, admin roles.
"""
import uuid
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied

from .models import Appointment
from .serializers import AppointmentCreateSerializer
from .authentication import JWTAuthentication
from .permissions import (
    IsAuthenticatedJWT,
    IsUserRole,
    IsDoctorRole,
)
from .utils import (
    is_valid_status_transition,
    fetch_doctor_availability_and_fee,
    UserServiceError,
)
from .producer import (
    publish_appointment_created,
    publish_appointment_cancelled,
)


class AppointmentAPIView(APIView):
    """
    Handles both POST /appointments (create) and GET /appointments (list).

    POST: Creates appointment (role=user only)
    GET: Lists appointments (role-based filtering)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    @transaction.atomic
    def post(self, request):
        """
        POST /appointments

        Creates a new appointment.
        Only role=user allowed.
        Validates doctor availability & fee via user_service.
        """
        # Check user role for POST
        if request.user_data.get("role") != "user":
            return Response(
                {"error": "Only users can create appointments"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AppointmentCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        data = serializer.validated_data

        # Extract user_id from JWT ONLY - never trust request body
        user_id = request.user_data["user_id"]
        doctor_id = data["doctor_id"]

        # Validate doctor availability & fee via user_service
        try:
            consultation_fee = fetch_doctor_availability_and_fee(doctor_id)
        except UserServiceError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create appointment with status="pending"
        # Convert user_id to UUID if needed (JWT may return int)
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        appointment = Appointment.objects.create(
            user_id=user_uuid,  # From JWT, not request body
            doctor_id=doctor_id,
            scheduled_at=data["scheduled_at"],
            severity_level=data.get("severity_level"),  # Advisory V1 data
            status="pending"
        )

        # Publish async event
        publish_appointment_created.delay(
            appointment_id=str(appointment.id),
            user_id=str(user_id),
            doctor_id=str(doctor_id),
            scheduled_at=appointment.scheduled_at.isoformat(),
            status=appointment.status,
        )

        return Response(
            {
                "appointment_id": appointment.id,
                "status": appointment.status,
                "consultation_fee": consultation_fee
            },
            status=status.HTTP_201_CREATED
        )

    def get(self, request):
        """
        GET /appointments

        Lists appointments based on role:
        - user → own appointments
        - doctor → appointments where doctor_id = JWT user_id
        - admin → read-only access (optional, V1: same as doctor)

        No identity via query params - all from JWT.
        """
        # Extract user_id and role from JWT ONLY
        user_id = request.user_data["user_id"]
        role = request.user_data.get("role")

        # Convert user_id to UUID if needed (JWT may return int)
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        # Filter based on role
        if role == "user":
            # User sees own appointments
            qs = Appointment.objects.filter(user_id=user_uuid)
        elif role == "doctor":
            # Doctor sees appointments assigned to them
            qs = Appointment.objects.filter(doctor_id=user_uuid)
        elif role == "admin":
            # Admin: read-only access (V1: same as doctor for now)
            qs = Appointment.objects.filter(doctor_id=user_uuid)
        else:
            return Response(
                {"error": "Invalid role"},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = qs.order_by("-scheduled_at")

        return Response([
            {
                "id": a.id,
                "user_id": a.user_id,
                "doctor_id": a.doctor_id,
                "scheduled_at": a.scheduled_at,
                "status": a.status,
                "severity_level": a.severity_level,
            }
            for a in qs
        ])


class AppointmentCancelAPIView(APIView):
    """
    POST /appointments/{id}/cancel

    Cancels an appointment.
    Only appointment owner can cancel.
    Validates state transition.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    @transaction.atomic
    def post(self, request, id):
        try:
            appointment = Appointment.objects.get(id=id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        # Extract user_id from JWT ONLY
        user_id = request.user_data["user_id"]

        # Convert user_id to UUID if needed (JWT may return int)
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        # Only owner can cancel (V1: no admin override)
        if appointment.user_id != user_uuid:
            raise PermissionDenied("Only appointment owner can cancel")

        # Validate state transition
        if not is_valid_status_transition(appointment.status, "cancelled"):
            return Response(
                {"error": "Invalid status transition"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status, do not delete
        appointment.status = "cancelled"
        appointment.save(update_fields=["status"])

        # Publish async event
        publish_appointment_cancelled.delay(
            appointment_id=str(appointment.id),
            user_id=str(appointment.user_id),
            doctor_id=str(appointment.doctor_id),
            scheduled_at=appointment.scheduled_at.isoformat(),
            status=appointment.status,
        )

        return Response({"status": "cancelled"})
