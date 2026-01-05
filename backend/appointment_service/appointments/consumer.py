"""
Event consumer for appointment_service.

Consumes RabbitMQ events from other services:
- doctor_approved
- doctor_rejected
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    name="appointments.handle_doctor_approved",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
    retry_backoff=True,
)
def handle_doctor_approved(
    self,
    *,
    user_id: int,
    email: str,
    name: str,
    specialization: str,
    **kwargs
):
    """
    Handles doctor_approved events from user_service.
    
    This consumer can be used to:
    - Update local cache of approved doctors
    - Send welcome emails to newly approved doctors
    - Create entries in appointment system for the new doctor
    """
    try:
        logger.info(f"Handling doctor_approved event for user_id: {user_id}")
        
        # TODO: Implement business logic for handling approved doctors
        # Examples:
        # 1. Create/update doctor record in appointment system
        # 2. Send welcome email to newly approved doctor
        # 3. Update cache of available doctors
        
        # For now, just log the event
        logger.info(f"✅ Doctor approved: {name} ({email}) - {specialization}")
        
        return {"status": "processed", "user_id": user_id}

    except Exception as exc:
        logger.error(f"Failed to handle doctor_approved event: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name="appointments.handle_doctor_rejected",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
    retry_backoff=True,
)
def handle_doctor_rejected(
    self,
    *,
    user_id: int,
    email: str,
    name: str,
    reason: str,
    **kwargs
):
    """
    Handles doctor_rejected events from user_service.
    
    This consumer can be used to:
    - Send rejection emails to doctors
    - Clean up any temporary records
    - Update analytics/metrics
    """
    try:
        logger.info(f"Handling doctor_rejected event for user_id: {user_id}")
        
        # TODO: Implement business logic for handling rejected doctors
        # Examples:
        # 1. Send rejection email to doctor
        # 2. Clean up temporary records
        # 3. Update metrics/analytics
        
        # For now, just log the event
        logger.info(f"❌ Doctor rejected: {name} ({email}) - Reason: {reason}")
        
        return {"status": "processed", "user_id": user_id}

    except Exception as exc:
        logger.error(f"Failed to handle doctor_rejected event: {exc}")
        raise self.retry(exc=exc)