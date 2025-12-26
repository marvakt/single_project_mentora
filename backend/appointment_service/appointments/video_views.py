"""
appointments/video_views.py - NEW FILE
Video session management for appointments
"""
import uuid
from django.db import transaction
from django.utils import timezone
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

        import secrets
        import string
        
        # Generate a unique room name
        room_name = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        # Create video session
        video_session = VideoSession.objects.create(
            appointment=appointment,
            provider=provider,
            session_id=session_id,
            token=user_token if role == "user" else doctor_token,
            user_token=user_token,
            doctor_token=doctor_token,
            doctor_approved=False,  # Doctor must approve before user can join
            room_name=room_name,
        )

        return Response({
            "session_id": video_session.session_id,
            "token": user_token if role == "user" else doctor_token,
            "provider": video_session.provider,
            "message": "Video session created successfully"
        }, status=status.HTTP_201_CREATED)


class VideoSessionDetailAPIView(APIView):
    """
    GET /appointments/{appointment_id}/video/
    
    Get video session details.
    PATCH /appointments/{appointment_id}/video/
    
    Update video session (e.g., mark as ended).
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

        # Check if appointment is in the right status for video call
        if appointment.status not in ['confirmed', 'completed']:
            return Response(
                {"error": "Appointment is not in a valid status for video call"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if it's within reasonable time window for the appointment
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        appointment_time = appointment.scheduled_at
        
        # Allow access for confirmed appointments within a broader window
        # This allows access from 1 hour before to 2 hours after appointment time
        time_window_start = appointment_time - timedelta(minutes=60)
        time_window_end = appointment_time + timedelta(hours=2)
        
        if now < time_window_start or now > time_window_end:
            return Response(
                {"error": f"Video call is only available from {time_window_start.strftime('%Y-%m-%d %H:%M')} to {time_window_end.strftime('%Y-%m-%d %H:%M')}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        video_session = appointment.video_session
        
        # Check if doctor has approved the video session
        # Doctors can always access the session, users can only access if approved
        if not video_session.doctor_approved and role == "user":
            return Response(
                {"error": "Video session not yet approved by doctor"},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            "session_id": video_session.session_id,
            "token": video_session.user_token if role == "user" else video_session.doctor_token,
            "provider": video_session.provider,
            "started_at": video_session.started_at.isoformat() if video_session.started_at else None,
            "ended_at": video_session.ended_at.isoformat() if video_session.ended_at else None,
            "is_active": video_session.is_active,
            "doctor_approved": video_session.doctor_approved,
            "room_name": video_session.room_name,
            "appointment_time": appointment_time.isoformat(),
            "current_time": now.isoformat(),
        })

    def patch(self, request, appointment_id):
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

        # Check if video session exists
        if not hasattr(appointment, 'video_session'):
            raise NotFound("Video session not found")

        video_session = appointment.video_session
        
        # Handle session approval by doctor
        if request.data.get('approve', None) is not None:
            if role != "doctor":
                raise PermissionDenied("Only doctor can approve video session")
            video_session.doctor_approved = request.data.get('approve', True)
            video_session.save(update_fields=['doctor_approved'])
            
            return Response({
                "session_id": video_session.session_id,
                "doctor_approved": video_session.doctor_approved,
                "message": "Video session approval updated successfully"
            })
        
        # Update session as ended if requested
        if request.data.get('ended', False):
            if not video_session.ended_at:
                video_session.ended_at = timezone.now()
            video_session.save(update_fields=['ended_at'])

        return Response({
            "session_id": video_session.session_id,
            "is_active": video_session.is_active,
            "ended_at": video_session.ended_at.isoformat() if video_session.ended_at else None,
            "doctor_approved": video_session.doctor_approved,
            "message": "Video session updated successfully"
        })

