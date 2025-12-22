"""
appointments/video_views.py - NEW FILE
Video session management for appointments
"""
import uuid
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied

from .models import Appointment, VideoSession
from .serializers import VideoSessionSerializer
from .authentication import JWTAuthentication
from .permissions import IsAuthenticatedJWT


class VideoSessionCreateAPIView(APIView):
    """
    POST /appointments/{appointment_id}/video/create
    
    Creates video session for confirmed appointment.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    @transaction.atomic
    def post(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        user_id = request.user_data["user_id"]
        role = request.user_data.get("role")
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        # Verify access
        if role == "user" and appointment.user_id != user_uuid:
            raise PermissionDenied("Access denied")
        elif role == "doctor" and appointment.doctor_id != user_uuid:
            raise PermissionDenied("Access denied")

        # Check appointment status
        if appointment.status != "confirmed":
            return Response(
                {"error": "Video session can only be created for confirmed appointments"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if session already exists
        if hasattr(appointment, 'video_session'):
            video_session = appointment.video_session
            return Response({
                "session_id": video_session.session_id,
                "token": video_session.user_token if role == "user" else video_session.doctor_token,
                "provider": video_session.provider,
                "message": "Video session already exists"
            })

        serializer = VideoSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        provider = serializer.validated_data.get("provider", "twilio")

        # Generate video tokens (placeholder - implement actual token generation)
        session_id = f"session_{appointment.id}"
        user_token = f"user_token_{appointment.user_id}"
        doctor_token = f"doctor_token_{appointment.doctor_id}"

        # Create video session
        video_session = VideoSession.objects.create(
            appointment=appointment,
            provider=provider,
            session_id=session_id,
            token=user_token if role == "user" else doctor_token,
            user_token=user_token,
            doctor_token=doctor_token,
        )

        return Response({
            "session_id": video_session.session_id,
            "token": user_token if role == "user" else doctor_token,
            "provider": video_session.provider,
            "message": "Video session created successfully"
        }, status=status.HTTP_201_CREATED)


class VideoSessionDetailAPIView(APIView):
    """
    GET /appointments/{appointment_id}/video
    
    Get video session details.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            raise NotFound("Appointment not found")

        if not hasattr(appointment, 'video_session'):
            raise NotFound("Video session not found")

        user_id = request.user_data["user_id"]
        role = request.user_data.get("role")
        user_uuid = uuid.UUID(int=user_id) if isinstance(user_id, int) else uuid.UUID(str(user_id))

        # Verify access
        if role == "user" and appointment.user_id != user_uuid:
            raise PermissionDenied("Access denied")
        elif role == "doctor" and appointment.doctor_id != user_uuid:
            raise PermissionDenied("Access denied")

        video_session = appointment.video_session

        return Response({
            "session_id": video_session.session_id,
            "token": video_session.user_token if role == "user" else video_session.doctor_token,
            "provider": video_session.provider,
            "started_at": video_session.started_at.isoformat() if video_session.started_at else None,
            "ended_at": video_session.ended_at.isoformat() if video_session.ended_at else None,
            "is_active": video_session.is_active,
        })

