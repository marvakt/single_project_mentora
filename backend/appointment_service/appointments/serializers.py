


# """
# appointments/serializers.py - UPDATED SERIALIZERS

# Enhanced serializers with better validation and medical integration.
# """
# from rest_framework import serializers
# from django.utils import timezone
# from datetime import timedelta


# class AppointmentCreateSerializer(serializers.Serializer):
#     """
#     Serializer for creating appointments.
    
#     user_id is extracted from JWT - NOT included in request body.
#     """
#     doctor_id = serializers.CharField(
#         help_text="ID of the doctor (UUID or legacy integer ID)"
#     )
#     scheduled_at = serializers.DateTimeField(
#         help_text="Appointment date and time (ISO 8601 format)"
#     )
#     severity_level = serializers.IntegerField(
#         required=False,
#         allow_null=True,
#         min_value=0,
#         max_value=27,
#         help_text="Mental health severity score (0-27), auto-fetched if not provided"
#     )
#     notes = serializers.CharField(
#         required=False,
#         allow_blank=True,
#         max_length=1000,
#         help_text="Additional notes about symptoms or concerns"
#     )

#     def validate_scheduled_at(self, value):
#         """
#         Validates that appointment is:
#         - In the future
#         - At least 1 hour from now
#         - During reasonable hours (8 AM - 8 PM)
#         - On a weekday (optional)
#         """
#         now = timezone.now()
        
#         # Must be in future
#         if value <= now:
#             raise serializers.ValidationError(
#                 "Appointment must be scheduled in the future"
#             )
        
#         # Must be at least 1 hour from now
#         min_time = now + timedelta(hours=1)
#         if value < min_time:
#             raise serializers.ValidationError(
#                 "Appointment must be scheduled at least 1 hour in advance"
#             )
        
#         # Check if too far in future (e.g., max 3 months)
#         max_time = now + timedelta(days=90)
#         if value > max_time:
#             raise serializers.ValidationError(
#                 "Appointment cannot be scheduled more than 3 months in advance"
#             )
        
#         # Check business hours (8 AM - 8 PM)
#         hour = value.hour
#         if hour < 8 or hour >= 20:
#             raise serializers.ValidationError(
#                 "Appointments must be scheduled between 8 AM and 8 PM"
#             )
        
#         return value

#     def validate_severity_level(self, value):
#         """Validates severity level if provided."""
#         if value is not None and (value < 0 or value > 27):
#             raise serializers.ValidationError(
#                 "Severity level must be between 0 and 27"
#             )
#         return value


# class AppointmentUpdateSerializer(serializers.Serializer):
#     """
#     Serializer for updating appointment (rescheduling).
#     """
#     scheduled_at = serializers.DateTimeField(
#         required=False,
#         help_text="New appointment date and time"
#     )
#     notes = serializers.CharField(
#         required=False,
#         allow_blank=True,
#         max_length=1000,
#         help_text="Updated notes"
#     )

#     def validate_scheduled_at(self, value):
#         """Same validation as create."""
#         if value is None:
#             return value
        
#         now = timezone.now()
        
#         if value <= now:
#             raise serializers.ValidationError(
#                 "Appointment must be scheduled in the future"
#             )
        
#         min_time = now + timedelta(hours=1)
#         if value < min_time:
#             raise serializers.ValidationError(
#                 "Appointment must be scheduled at least 1 hour in advance"
#             )
        
#         hour = value.hour
#         if hour < 8 or hour >= 20:
#             raise serializers.ValidationError(
#                 "Appointments must be scheduled between 8 AM and 8 PM"
#             )
        
#         return value




# class VideoSessionSerializer(serializers.Serializer):
#     """
#     Serializer for video session creation.
#     """
#     provider = serializers.ChoiceField(
#         choices=['twilio', 'agora'],
#         default='twilio',
#         help_text="Video provider to use"
#     )

#     def validate_provider(self, value):
#         """Validates video provider is supported."""
#         if value not in ['twilio', 'agora']:
#             raise serializers.ValidationError(
#                 "Invalid video provider. Must be 'twilio' or 'agora'"
#             )
#         return value


"""
appointments/serializers.py - RESTRUCTURED SERIALIZERS

Clean serializers with proper validation and field handling.
All business logic moved to utils.py.
"""
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Appointment, Payment, VideoSession


class AppointmentCreateSerializer(serializers.Serializer):
    """
    Serializer for creating appointments.
    user_id is extracted from JWT - NOT included in request body.
    """
    doctor_id = serializers.UUIDField(
        help_text="ID of the doctor (UUID format)"
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
        default="",
        max_length=1000,
        help_text="Additional notes about symptoms or concerns"
    )

    def validate_scheduled_at(self, value):
        """Validates appointment scheduling constraints."""
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
        
        # Check if too far in future (max 3 months)
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
        """Validates severity level range."""
        if value is not None and (value < 0 or value > 27):
            raise serializers.ValidationError(
                "Severity level must be between 0 and 27"
            )
        return value


class AppointmentUpdateSerializer(serializers.Serializer):
    """Serializer for updating appointment (rescheduling)."""
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


class AppointmentListSerializer(serializers.ModelSerializer):
    """Serializer for listing appointments."""
    payment_status = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    priority_level = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'user_id', 'doctor_id', 'scheduled_at', 'status',
            'severity_level', 'notes', 'created_at', 'payment_status',
            'amount', 'priority_level'
        ]
    
    def get_payment_status(self, obj):
        """Get payment status if exists."""
        return obj.payment.status if hasattr(obj, 'payment') else None
    
    def get_amount(self, obj):
        """Get payment amount if exists."""
        return str(obj.payment.amount) if hasattr(obj, 'payment') else None
    
    def get_priority_level(self, obj):
        """Get priority level from model property."""
        return obj.priority_level


class AppointmentDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed appointment view."""
    payment = serializers.SerializerMethodField()
    video_session = serializers.SerializerMethodField()
    priority_level = serializers.SerializerMethodField()
    is_high_priority = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'user_id', 'doctor_id', 'scheduled_at', 'status',
            'severity_level', 'notes', 'created_at', 'updated_at',
            'payment', 'video_session', 'priority_level', 'is_high_priority'
        ]
    
    def get_payment(self, obj):
        """Get payment details if exists."""
        if hasattr(obj, 'payment'):
            return {
                'status': obj.payment.status,
                'amount': str(obj.payment.amount),
                'currency': obj.payment.currency,
                'razorpay_order_id': obj.payment.razorpay_order_id,
            }
        return None
    
    def get_video_session(self, obj):
        """Get video session details if exists."""
        if hasattr(obj, 'video_session'):
            vs = obj.video_session
            return {
                'provider': vs.provider,
                'session_id': vs.session_id,
                'started_at': vs.started_at.isoformat() if vs.started_at else None,
                'is_active': vs.is_active,
                'doctor_approved': vs.doctor_approved,
            }
        return None
    
    def get_priority_level(self, obj):
        """Get priority level from model property."""
        return obj.priority_level
    
    def get_is_high_priority(self, obj):
        """Get high priority status from model property."""
        return obj.is_high_priority


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for payment creation (validation only)."""
    pass  # All validation done in view/utils


class PaymentWebhookSerializer(serializers.Serializer):
    """Serializer for Razorpay webhook validation."""
    razorpay_order_id = serializers.CharField(required=True)
    razorpay_payment_id = serializers.CharField(required=True)
    razorpay_signature = serializers.CharField(required=True)
    event = serializers.CharField(required=False)


class VideoSessionCreateSerializer(serializers.Serializer):
    """Serializer for video session creation."""
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


class VideoSessionDetailSerializer(serializers.ModelSerializer):
    """Serializer for video session details."""
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = VideoSession
        fields = [
            'id', 'session_id', 'provider', 'started_at', 'ended_at',
            'is_active', 'doctor_approved', 'room_name', 'duration_minutes'
        ]
        read_only_fields = ['id', 'session_id', 'started_at', 'ended_at', 'duration_minutes']
    
    def get_is_active(self, obj):
        """Get active status from model property."""
        return obj.is_active


class VideoSessionUpdateSerializer(serializers.Serializer):
    """Serializer for updating video session."""
    approve = serializers.BooleanField(required=False)
    ended = serializers.BooleanField(required=False)


class AvailableSlotsRequestSerializer(serializers.Serializer):
    """Serializer for available slots request validation."""
    date = serializers.DateField(
        help_text="Date for which to fetch available slots (YYYY-MM-DD)"
    )
    
    def validate_date(self, value):
        """Validate date is not in the past."""
        if value < timezone.now().date():
            raise serializers.ValidationError("Date cannot be in the past")
        return value