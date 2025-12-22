# """
# Secure appointment views for appointment_service V1.

# All endpoints validate JWT via auth_service.
# Extract user_id from JWT ONLY - never trust request body/query params.
# Enforce RBAC: user, doctor, admin roles.
# """
# import uuid
# from django.db import transaction
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.exceptions import NotFound, PermissionDenied

# from .models import Appointment
# from .serializers import AppointmentCreateSerializer
# from .authentication import JWTAuthentication
# from .permissions import (
#     IsAuthenticatedJWT,
#     IsUserRole,
#     IsDoctorRole,
# )
# from .utils import (
#     is_valid_status_transition,
#     fetch_doctor_availability_and_fee,
#     UserServiceError,
# )
# from .producer import (
#     publish_appointment_created,
#     publish_appointment_cancelled,
# )


# class AppointmentAPIView(APIView):
#     """
#     Handles both POST /appointments (create) and GET /appointments (list).

#     POST: Creates appointment (role=user only)
#     GET: Lists appointments (role-based filtering)
#     """
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticatedJWT]

#     @transaction.atomic
#     def post(self, request):
#         """
#         POST /appointments

#         Creates a new appointment.
#         Only role=user allowed.
#         Validates doctor availability & fee via user_service.
#         """
#         # Check user role for POST
#         if request.user_data.get("role") != "user":
#             return Response(
#                 {"error": "Only users can create appointments"},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         serializer = AppointmentCreateSerializer(data=request.data)

#         if not serializer.is_valid():
#             return Response(
#                 serializer.errors,
#                 status=status.HTTP_422_UNPROCESSABLE_ENTITY
#             )

#         data = serializer.validated_data

#         # Extract user_id from JWT ONLY - never trust request body
#         user_id = request.user_data["user_id"]
#         doctor_id = data["doctor_id"]

#         # Validate doctor availability & fee via user_service
#         try:
#             consultation_fee = fetch_doctor_availability_and_fee(doctor_id)
#         except UserServiceError as e:
#             return Response(
#                 {"error": str(e)},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Create appointment with status="pending"
#         # Convert user_id to UUID if needed (JWT may return int)
#         user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

#         appointment = Appointment.objects.create(
#             user_id=user_uuid,  # From JWT, not request body
#             doctor_id=doctor_id,
#             scheduled_at=data["scheduled_at"],
#             severity_level=data.get("severity_level"),  # Advisory V1 data
#             status="pending"
#         )

#         # Publish async event
#         publish_appointment_created.delay(
#             appointment_id=str(appointment.id),
#             user_id=str(user_id),
#             doctor_id=str(doctor_id),
#             scheduled_at=appointment.scheduled_at.isoformat(),
#             status=appointment.status,
#         )

#         return Response(
#             {
#                 "appointment_id": appointment.id,
#                 "status": appointment.status,
#                 "consultation_fee": consultation_fee
#             },
#             status=status.HTTP_201_CREATED
#         )

#     def get(self, request):
#         """
#         GET /appointments

#         Lists appointments based on role:
#         - user → own appointments
#         - doctor → appointments where doctor_id = JWT user_id
#         - admin → read-only access (optional, V1: same as doctor)

#         No identity via query params - all from JWT.
#         """
#         # Extract user_id and role from JWT ONLY
#         user_id = request.user_data["user_id"]
#         role = request.user_data.get("role")

#         # Convert user_id to UUID if needed (JWT may return int)
#         user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

#         # Filter based on role
#         if role == "user":
#             # User sees own appointments
#             qs = Appointment.objects.filter(user_id=user_uuid)
#         elif role == "doctor":
#             # Doctor sees appointments assigned to them
#             qs = Appointment.objects.filter(doctor_id=user_uuid)
#         elif role == "admin":
#             # Admin: read-only access (V1: same as doctor for now)
#             qs = Appointment.objects.filter(doctor_id=user_uuid)
#         else:
#             return Response(
#                 {"error": "Invalid role"},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         qs = qs.order_by("-scheduled_at")

#         return Response([
#             {
#                 "id": a.id,
#                 "user_id": a.user_id,
#                 "doctor_id": a.doctor_id,
#                 "scheduled_at": a.scheduled_at,
#                 "status": a.status,
#                 "severity_level": a.severity_level,
#             }
#             for a in qs
#         ])


# class AppointmentCancelAPIView(APIView):
#     """
#     POST /appointments/{id}/cancel

#     Cancels an appointment.
#     Only appointment owner can cancel.
#     Validates state transition.
#     """
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticatedJWT]

#     @transaction.atomic
#     def post(self, request, id):
#         try:
#             appointment = Appointment.objects.get(id=id)
#         except Appointment.DoesNotExist:
#             raise NotFound("Appointment not found")

#         # Extract user_id from JWT ONLY
#         user_id = request.user_data["user_id"]

#         # Convert user_id to UUID if needed (JWT may return int)
#         user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

#         # Only owner can cancel (V1: no admin override)
#         if appointment.user_id != user_uuid:
#             raise PermissionDenied("Only appointment owner can cancel")

#         # Validate state transition
#         if not is_valid_status_transition(appointment.status, "cancelled"):
#             return Response(
#                 {"error": "Invalid status transition"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Update status, do not delete
#         appointment.status = "cancelled"
#         appointment.save(update_fields=["status"])

#         # Publish async event
#         publish_appointment_cancelled.delay(
#             appointment_id=str(appointment.id),
#             user_id=str(appointment.user_id),
#             doctor_id=str(appointment.doctor_id),
#             scheduled_at=appointment.scheduled_at.isoformat(),
#             status=appointment.status,
#         )

#         return Response({"status": "cancelled"})


"""
appointments/views.py - UPDATED WITH MEDICAL SERVICE INTEGRATION

Secure appointment views for appointment_service V2.
Now includes medical service integration for severity-based routing.
"""
import uuid
import requests
from django.db import transaction
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied

from .models import Appointment
from .serializers import AppointmentCreateSerializer
from .authentication import JWTAuthentication
from .permissions import IsAuthenticatedJWT, IsUserRole, IsDoctorRole
from .utils import (
    is_valid_status_transition,
    fetch_doctor_availability_and_fee,
    fetch_user_severity_level,
    UserServiceError,
    MedicalServiceError,
)
from .producer import (
    publish_appointment_created,
    publish_appointment_cancelled,
    publish_appointment_completed,
)


class AppointmentAPIView(APIView):
    """
    Handles POST /appointments (create) and GET /appointments (list).
    
    Enhanced with medical service integration for severity-based routing.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    @transaction.atomic
    def post(self, request):
        """
        POST /appointments
        
        Creates a new appointment with severity-based priority.
        - Fetches user's latest severity from medical_service
        - Validates doctor availability
        - Creates appointment with severity level
        """
        # Check user role
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
        user_id = request.user_data["user_id"]
        doctor_id = data["doctor_id"]

        # Convert user_id to UUID
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        # Fetch user's latest severity from medical_service
        severity_data = None
        try:
            severity_data = fetch_user_severity_level(user_id, request.headers.get("Authorization"))
        except MedicalServiceError as e:
            # Non-blocking: continue without severity if medical service unavailable
            print(f"⚠️ Medical service unavailable: {e}")

        # Validate doctor availability
        try:
            doctor_data = fetch_doctor_availability_and_fee(doctor_id)
            consultation_fee = doctor_data.get("consultation_fee")
        except UserServiceError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine priority based on severity
        priority = "normal"
        severity_level = None
        if severity_data:
            severity_level = severity_data.get("severity_level")
            if severity_level in ["severe", "moderately_severe"]:
                priority = "high"
            elif severity_level == "moderate":
                priority = "medium"

        # Create appointment
        appointment = Appointment.objects.create(
            user_id=user_uuid,
            doctor_id=doctor_id,
            scheduled_at=data["scheduled_at"],
            severity_level=data.get("severity_level") or severity_data.get("raw_score") if severity_data else None,
            status="pending",
            notes=data.get("notes", "")
        )

        # Publish event
        publish_appointment_created.delay(
            appointment_id=str(appointment.id),
            user_id=str(user_id),
            doctor_id=str(doctor_id),
            scheduled_at=appointment.scheduled_at.isoformat(),
            status=appointment.status,
            severity_level=severity_level,
            priority=priority,
        )

        return Response(
            {
                "appointment_id": str(appointment.id),
                "status": appointment.status,
                "consultation_fee": consultation_fee,
                "priority": priority,
                "severity_level": severity_level,
                "scheduled_at": appointment.scheduled_at.isoformat(),
            },
            status=status.HTTP_201_CREATED
        )

    def get(self, request):
        """
        GET /appointments
        
        Lists appointments with enhanced filtering:
        - user → own appointments with severity info
        - doctor → assigned appointments with patient severity
        - admin → all appointments
        """
        user_id = request.user_data["user_id"]
        role = request.user_data.get("role")
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        # Filter based on role
        if role == "user":
            qs = Appointment.objects.filter(user_id=user_uuid)
        elif role == "doctor":
            qs = Appointment.objects.filter(doctor_id=user_uuid)
        elif role == "admin":
            qs = Appointment.objects.all()
        else:
            return Response(
                {"error": "Invalid role"},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = qs.order_by("-scheduled_at")

        # Enhanced response with additional fields
        appointments = []
        for a in qs:
            appointment_data = {
                "id": str(a.id),
                "user_id": str(a.user_id),
                "doctor_id": str(a.doctor_id),
                "scheduled_at": a.scheduled_at.isoformat(),
                "status": a.status,
                "severity_level": a.severity_level,
                "notes": a.notes if hasattr(a, 'notes') else "",
                "created_at": a.created_at.isoformat(),
            }
            
            # Add payment status if exists
            if hasattr(a, 'payment'):
                appointment_data["payment_status"] = a.payment.status
                appointment_data["amount"] = str(a.payment.amount)
            
            appointments.append(appointment_data)

        return Response({
            "appointments": appointments,
            "total": len(appointments)
        })


class AppointmentDetailAPIView(APIView):
    """
    GET /appointments/{id}
    
    Get detailed appointment information including medical context.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, id):
        try:
            appointment = Appointment.objects.get(id=id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        user_id = request.user_data["user_id"]
        role = request.user_data.get("role")
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        # Check access permissions
        if role == "user" and appointment.user_id != user_uuid:
            raise PermissionDenied("Access denied")
        elif role == "doctor" and appointment.doctor_id != user_uuid:
            raise PermissionDenied("Access denied")

        # Build response
        response_data = {
            "id": str(appointment.id),
            "user_id": str(appointment.user_id),
            "doctor_id": str(appointment.doctor_id),
            "scheduled_at": appointment.scheduled_at.isoformat(),
            "status": appointment.status,
            "severity_level": appointment.severity_level,
            "notes": appointment.notes if hasattr(appointment, 'notes') else "",
            "created_at": appointment.created_at.isoformat(),
            "updated_at": appointment.updated_at.isoformat(),
        }

        # Add payment info
        if hasattr(appointment, 'payment'):
            response_data["payment"] = {
                "status": appointment.payment.status,
                "amount": str(appointment.payment.amount),
                "currency": appointment.payment.currency,
                "razorpay_order_id": appointment.payment.razorpay_order_id,
            }

        # Add video session info
        if hasattr(appointment, 'video_session'):
            response_data["video_session"] = {
                "provider": appointment.video_session.provider,
                "session_id": appointment.video_session.session_id,
                "started_at": appointment.video_session.started_at.isoformat() if appointment.video_session.started_at else None,
            }

        # For doctors: fetch patient's medical summary
        if role == "doctor":
            try:
                medical_summary = fetch_medical_summary(
                    str(appointment.user_id),
                    request.headers.get("Authorization")
                )
                response_data["patient_medical_summary"] = medical_summary
            except Exception as e:
                print(f"⚠️ Failed to fetch medical summary: {e}")

        return Response(response_data)


class AppointmentCancelAPIView(APIView):
    """
    POST /appointments/{id}/cancel
    
    Cancels an appointment with proper validation.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    @transaction.atomic
    def post(self, request, id):
        try:
            appointment = Appointment.objects.get(id=id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        user_id = request.user_data["user_id"]
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        # Only owner can cancel
        if appointment.user_id != user_uuid:
            raise PermissionDenied("Only appointment owner can cancel")

        # Validate state transition
        if not is_valid_status_transition(appointment.status, "cancelled"):
            return Response(
                {"error": f"Cannot cancel appointment with status '{appointment.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status
        appointment.status = "cancelled"
        appointment.save(update_fields=["status", "updated_at"])

        # Publish event
        publish_appointment_cancelled.delay(
            appointment_id=str(appointment.id),
            user_id=str(appointment.user_id),
            doctor_id=str(appointment.doctor_id),
            scheduled_at=appointment.scheduled_at.isoformat(),
            status=appointment.status,
        )

        return Response({
            "status": "cancelled",
            "message": "Appointment cancelled successfully"
        })


class AppointmentCompleteAPIView(APIView):
    """
    POST /appointments/{id}/complete
    
    Marks appointment as completed (Doctor only).
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctorRole]

    @transaction.atomic
    def post(self, request, id):
        try:
            appointment = Appointment.objects.get(id=id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        user_id = request.user_data["user_id"]
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        # Only assigned doctor can complete
        if appointment.doctor_id != user_uuid:
            raise PermissionDenied("Only assigned doctor can complete appointment")

        # Validate state transition
        if not is_valid_status_transition(appointment.status, "completed"):
            return Response(
                {"error": f"Cannot complete appointment with status '{appointment.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status
        appointment.status = "completed"
        appointment.save(update_fields=["status", "updated_at"])

        # Publish event
        publish_appointment_completed.delay(
            appointment_id=str(appointment.id),
            user_id=str(appointment.user_id),
            doctor_id=str(appointment.doctor_id),
            scheduled_at=appointment.scheduled_at.isoformat(),
            status=appointment.status,
        )

        return Response({
            "status": "completed",
            "message": "Appointment marked as completed"
        })


# Helper function to fetch medical summary
def fetch_medical_summary(user_id: str, auth_header: str) -> dict:
    """
    Fetches patient's medical summary from medical_service.
    """
    try:
        headers = {"Authorization": auth_header} if auth_header else {}
        response = requests.get(
            f"{settings.MEDICAL_SERVICE_BASE_URL}/summary/user/{user_id}",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            return response.json()
        return {}
    except Exception as e:
        print(f"Failed to fetch medical summary: {e}")
        return {}