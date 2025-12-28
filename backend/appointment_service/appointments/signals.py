"""
appointments/signals.py - CUSTOM SIGNALS

Handles automatic actions triggered by model changes.
Follows Django best practices for signal handling.
"""
import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver, Signal
from django.utils import timezone

from .models import Appointment, Payment, VideoSession

logger = logging.getLogger(__name__)


# ==================== CUSTOM SIGNALS ====================

# Custom signal for appointment status changes
appointment_status_changed = Signal()

# Custom signal for payment completion
payment_completed = Signal()

# Custom signal for video session started
video_session_started = Signal()


# ==================== APPOINTMENT SIGNALS ====================

@receiver(pre_save, sender=Appointment)
def track_appointment_status_change(sender, instance, **kwargs):
    """
    Tracks appointment status changes before save.
    Sends custom signal if status changed.
    """
    if instance.pk:  # Existing appointment
        try:
            old_instance = Appointment.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Store old status for post_save signal
                instance._old_status = old_instance.status
                logger.info(
                    f"Appointment {instance.id} status changing: "
                    f"{old_instance.status} -> {instance.status}"
                )
        except Appointment.DoesNotExist:
            pass


@receiver(post_save, sender=Appointment)
def handle_appointment_status_change(sender, instance, created, **kwargs):
    """
    Handles post-save actions for appointments.
    Sends custom signal when status changes.
    """
    if created:
        logger.info(f"New appointment created: {instance.id}")
        return
    
    # Check if status changed
    if hasattr(instance, '_old_status'):
        old_status = instance._old_status
        new_status = instance.status
        
        # Send custom signal
        appointment_status_changed.send(
            sender=sender,
            appointment=instance,
            old_status=old_status,
            new_status=new_status
        )
        
        # Clean up temporary attribute
        delattr(instance, '_old_status')
        
        logger.info(
            f"Appointment {instance.id} status changed: {old_status} -> {new_status}"
        )


@receiver(appointment_status_changed)
def log_appointment_status_change(sender, appointment, old_status, new_status, **kwargs):
    """
    Logs appointment status changes for audit trail.
    Can be extended to send notifications, update analytics, etc.
    """
    logger.info(
        f"[AUDIT] Appointment {appointment.id}: "
        f"Status changed from {old_status} to {new_status} "
        f"at {timezone.now().isoformat()}"
    )
    
    # Example: Send notification based on status
    if new_status == 'confirmed':
        logger.info(f"Appointment {appointment.id} confirmed - ready for video session")
    elif new_status == 'cancelled':
        logger.info(f"Appointment {appointment.id} cancelled - cleanup required")
    elif new_status == 'completed':
        logger.info(f"Appointment {appointment.id} completed - ready for feedback")


# ==================== PAYMENT SIGNALS ====================

@receiver(post_save, sender=Payment)
def handle_payment_status_change(sender, instance, created, **kwargs):
    """
    Handles post-save actions for payments.
    Automatically confirms appointment when payment is successful.
    """
    if created:
        logger.info(f"Payment created: {instance.id} for appointment {instance.appointment.id}")
        return
    
    # Check if payment status changed to 'paid'
    if instance.status == 'paid':
        appointment = instance.appointment
        
        # Auto-confirm appointment if still pending
        if appointment.status == 'pending':
            appointment.status = 'confirmed'
            appointment.save(update_fields=['status'])
            logger.info(
                f"Appointment {appointment.id} auto-confirmed after payment {instance.id}"
            )
        
        # Send custom signal
        payment_completed.send(
            sender=sender,
            payment=instance,
            appointment=appointment
        )


@receiver(payment_completed)
def log_payment_completion(sender, payment, appointment, **kwargs):
    """
    Logs payment completion for audit trail.
    """
    logger.info(
        f"[AUDIT] Payment {payment.id} completed: "
        f"Amount {payment.amount} {payment.currency} "
        f"for appointment {appointment.id} "
        f"at {timezone.now().isoformat()}"
    )


# ==================== VIDEO SESSION SIGNALS ====================

@receiver(post_save, sender=VideoSession)
def handle_video_session_changes(sender, instance, created, **kwargs):
    """
    Handles post-save actions for video sessions.
    Tracks session start and end times.
    """
    if created:
        logger.info(
            f"Video session created: {instance.id} "
            f"for appointment {instance.appointment.id}"
        )
        return
    
    # Track session start
    if instance.started_at and not instance.ended_at:
        video_session_started.send(
            sender=sender,
            video_session=instance,
            appointment=instance.appointment
        )


@receiver(video_session_started)
def log_video_session_start(sender, video_session, appointment, **kwargs):
    """
    Logs video session start for audit trail.
    Can calculate session duration when ended.
    """
    logger.info(
        f"[AUDIT] Video session {video_session.id} started: "
        f"Appointment {appointment.id} "
        f"at {video_session.started_at.isoformat()}"
    )


@receiver(pre_save, sender=VideoSession)
def calculate_session_duration(sender, instance, **kwargs):
    """
    Automatically calculates video session duration when ended.
    """
    if instance.ended_at and instance.started_at:
        # Calculate duration in minutes
        duration = (instance.ended_at - instance.started_at).total_seconds() / 60
        instance.duration_minutes = int(duration)
        
        logger.info(
            f"Video session {instance.id} duration calculated: "
            f"{instance.duration_minutes} minutes"
        )


# ==================== APPOINTMENT CLEANUP SIGNALS ====================

@receiver(appointment_status_changed)
def cleanup_cancelled_appointment_resources(sender, appointment, old_status, new_status, **kwargs):
    """
    Cleans up resources when appointment is cancelled.
    Example: Mark video session as inactive, initiate refund, etc.
    """
    if new_status == 'cancelled':
        # If video session exists, mark it as inactive
        if hasattr(appointment, 'video_session'):
            video_session = appointment.video_session
            if not video_session.ended_at:
                video_session.ended_at = timezone.now()
                video_session.save(update_fields=['ended_at'])
                logger.info(
                    f"Video session {video_session.id} ended due to appointment cancellation"
                )
        
        # Check if refund needed (payment exists and is paid)
        if hasattr(appointment, 'payment') and appointment.payment.status == 'paid':
            logger.info(
                f"Refund required for cancelled appointment {appointment.id}, "
                f"payment {appointment.payment.id}"
            )
            # TODO: Implement refund logic here


# ==================== HIGH PRIORITY APPOINTMENT TRACKING ====================

@receiver(post_save, sender=Appointment)
def track_high_priority_appointments(sender, instance, created, **kwargs):
    """
    Tracks high priority appointments (high severity level).
    Can be used to trigger alerts, prioritize scheduling, etc.
    """
    if created and instance.is_high_priority:
        logger.warning(
            f"[HIGH PRIORITY] Appointment {instance.id} created with "
            f"severity level {instance.severity_level} (Priority: {instance.priority_level})"
        )
        # TODO: Send alert to admin/doctor
        # TODO: Prioritize this appointment in queue


# ==================== SIGNAL REGISTRATION ====================

def register_signals():
    """
    Explicit signal registration function.
    Call this in apps.py ready() method.
    """
    logger.info("Appointment service signals registered")