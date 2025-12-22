# """
# Serializers for appointment_service V1.

# Note: user_id is NOT in serializer - extracted from JWT only.
# """
# from rest_framework import serializers
# from django.utils import timezone


# class AppointmentCreateSerializer(serializers.Serializer):
#     """
#     Serializer for creating appointments.

#     V1: user_id is NOT included - extracted from JWT only.
#     """
#     doctor_id = serializers.UUIDField()
#     scheduled_at = serializers.DateTimeField()
#     severity_level = serializers.IntegerField(required=False, allow_null=True)

#     def validate_scheduled_at(self, value):
#         if value <= timezone.now():
#             raise serializers.ValidationError(
#                 "Appointment must be in the future"
#             )
#         return value




"""
appointments/serializers.py - UPDATED SERIALIZERS

Enhanced serializers with better validation and medical integration.
"""
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta


class AppointmentCreateSerializer(serializers.Serializer):
    """
    Serializer for creating appointments.
    
    user_id is extracted from JWT - NOT included in request body.
    """
    doctor_id = serializers.UUIDField(
        help_text="UUID of the doctor to book"
    )
    scheduled_at = serializers.DateTimeField(
        help_text="Appointment date and time (ISO 8601 format)"
    )
    severity_level = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=0,
        max_value=27,
        help_text="Mental health severity score (0-27), auto-fetched if not provided"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text="Additional notes about symptoms or concerns"
    )

    def validate_scheduled_at(self, value):
        """
        Validates that appointment is:
        - In the future
        - At least 1 hour from now
        - During reasonable hours (8 AM - 8 PM)
        - On a weekday (optional)
        """
        now = timezone.now()
        
        # Must be in future
        if value <= now:
            raise serializers.ValidationError(
                "Appointment must be scheduled in the future"
            )
        
        # Must be at least 1 hour from now
        min_time = now + timedelta(hours=1)
        if value < min_time:
            raise serializers.ValidationError(
                "Appointment must be scheduled at least 1 hour in advance"
            )
        
        # Check if too far in future (e.g., max 3 months)
        max_time = now + timedelta(days=90)
        if value > max_time:
            raise serializers.ValidationError(
                "Appointment cannot be scheduled more than 3 months in advance"
            )
        
        # Check business hours (8 AM - 8 PM)
        hour = value.hour
        if hour < 8 or hour >= 20:
            raise serializers.ValidationError(
                "Appointments must be scheduled between 8 AM and 8 PM"
            )
        
        return value

    def validate_severity_level(self, value):
        """Validates severity level if provided."""
        if value is not None and (value < 0 or value > 27):
            raise serializers.ValidationError(
                "Severity level must be between 0 and 27"
            )
        return value


class AppointmentUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating appointment (rescheduling).
    """
    scheduled_at = serializers.DateTimeField(
        required=False,
        help_text="New appointment date and time"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text="Updated notes"
    )

    def validate_scheduled_at(self, value):
        """Same validation as create."""
        if value is None:
            return value
        
        now = timezone.now()
        
        if value <= now:
            raise serializers.ValidationError(
                "Appointment must be scheduled in the future"
            )
        
        min_time = now + timedelta(hours=1)
        if value < min_time:
            raise serializers.ValidationError(
                "Appointment must be scheduled at least 1 hour in advance"
            )
        
        hour = value.hour
        if hour < 8 or hour >= 20:
            raise serializers.ValidationError(
                "Appointments must be scheduled between 8 AM and 8 PM"
            )
        
        return value




class VideoSessionSerializer(serializers.Serializer):
    """
    Serializer for video session creation.
    """
    provider = serializers.ChoiceField(
        choices=['twilio', 'agora'],
        default='twilio',
        help_text="Video provider to use"
    )

    def validate_provider(self, value):
        """Validates video provider is supported."""
        if value not in ['twilio', 'agora']:
            raise serializers.ValidationError(
                "Invalid video provider. Must be 'twilio' or 'agora'"
            )
        return value