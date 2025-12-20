"""
Serializers for appointment_service V1.

Note: user_id is NOT in serializer - extracted from JWT only.
"""
from rest_framework import serializers
from django.utils import timezone


class AppointmentCreateSerializer(serializers.Serializer):
    """
    Serializer for creating appointments.

    V1: user_id is NOT included - extracted from JWT only.
    """
    doctor_id = serializers.UUIDField()
    scheduled_at = serializers.DateTimeField()
    severity_level = serializers.IntegerField(required=False, allow_null=True)

    def validate_scheduled_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError(
                "Appointment must be in the future"
            )
        return value
