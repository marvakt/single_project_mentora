




"""
appointments/models.py - UPDATED MODELS

Enhanced models with better field support and medical integration.
"""
import uuid

from django.db import models


class Appointment(models.Model):
    """
    Appointment model with medical service integration.
    
    Stores appointment details including severity level for priority handling.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),       # Created, awaiting payment
        ('confirmed', 'Confirmed'),   # Payment successful
        ('completed', 'Completed'),   # Session completed
        ('cancelled', 'Cancelled'),   # Cancelled by user/system
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    doctor_id = models.UUIDField(db_index=True)

    scheduled_at = models.DateTimeField(db_index=True)
    severity_level = models.PositiveSmallIntegerField(
        null=True, 
        blank=True,
        help_text="Mental health severity score (0-27 from PHQ-9)"
    )
    
    notes = models.TextField(
        blank=True,
        default="",
        help_text="Additional notes from user about symptoms/concerns"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointments'
        ordering = ['-scheduled_at']
        indexes = [
            models.Index(fields=['doctor_id', 'scheduled_at']),
            models.Index(fields=['user_id', 'status']),
            models.Index(fields=['status', 'scheduled_at']),
            models.Index(fields=['severity_level']),  # For priority queries
        ]

    def __str__(self):
        return f"Appointment {self.id} - {self.status}"
    
    @property
    def is_high_priority(self):
        """Returns True if appointment is high priority based on severity."""
        return self.severity_level and self.severity_level >= 15
    
    @property
    def priority_level(self):
        """Returns priority level: high, medium, normal."""
        if not self.severity_level:
            return "normal"
        if self.severity_level >= 20:
            return "high"
        elif self.severity_level >= 10:
            return "medium"
        return "normal"


class Payment(models.Model):
    """
    Payment model for appointment transactions.
    
    Integrates with Razorpay for payment processing.
    """
    STATUS_CHOICES = (
        ('created', 'Created'),     # Order created
        ('paid', 'Paid'),          # Payment successful
        ('failed', 'Failed'),      # Payment failed
        ('refunded', 'Refunded'),  # Payment refunded
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='payment'
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')

    razorpay_order_id = models.CharField(max_length=255, unique=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=255, null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='created',
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    refund_id = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="Razorpay refund ID if refunded"
    )
    refund_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.id} - {self.status}"


class VideoSession(models.Model):
    """
    Video consultation session details.
    
    Supports Twilio and Agora video providers.
    """
    PROVIDER_CHOICES = (
        ('twilio', 'Twilio'),
        ('agora', 'Agora'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='video_session'
    )

    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    session_id = models.CharField(max_length=255, db_index=True)
    token = models.TextField(help_text="Video session token for client")
    
    # Doctor and user tokens (for separate access)
    doctor_token = models.TextField(blank=True, help_text="Doctor's video token")
    user_token = models.TextField(blank=True, help_text="User's video token")
    
    # Whether the doctor has approved the video session
    doctor_approved = models.BooleanField(default=False, help_text="Whether doctor has approved this video session")
    
    # WebRTC connection details
    room_name = models.CharField(max_length=255, blank=True, help_text="WebRTC room name for the video session")

    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Session duration in minutes"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'video_sessions'
        ordering = ['-created_at']

    def __str__(self):
        return f"VideoSession {self.id} ({self.provider})"
    
    @property
    def is_active(self):
        """Returns True if session is currently active."""
        return self.started_at is not None and self.ended_at is None

