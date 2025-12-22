"""
Event consumer for medical_service.

Consumes RabbitMQ events from other services:
- doctor_approved
- doctor_rejected
"""
import logging
from celery import Celery
import os

# Configure Celery client
celery_app = Celery("medical_service")
celery_app.conf.update(
    broker_url=os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/"),
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        'medical.handle_doctor_approved': {'queue': 'doctor_approved'},
        'medical.handle_doctor_rejected': {'queue': 'doctor_rejected'},
    }
)

logger = logging.getLogger(__name__)


@celery_app.task(
    name="medical.handle_doctor_approved",
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
    - Update local records of approved doctors
    - Send notifications to medical team
    - Update analytics/metrics
    """
    try:
        logger.info(f"Handling doctor_approved event for user_id: {user_id}")
        
        # TODO: Implement business logic for handling approved doctors
        # Examples:
        # 1. Update local records of approved doctors
        # 2. Send notifications to medical team
        # 3. Update analytics/metrics
        
        # For now, just log the event
        logger.info(f"✅ Doctor approved in medical service: {name} ({email}) - {specialization}")
        
        return {"status": "processed", "user_id": user_id}

    except Exception as exc:
        logger.error(f"Failed to handle doctor_approved event: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    name="medical.handle_doctor_rejected",
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
    - Update records of rejected doctors
    - Send notifications to medical team
    - Update analytics/metrics
    """
    try:
        logger.info(f"Handling doctor_rejected event for user_id: {user_id}")
        
        # TODO: Implement business logic for handling rejected doctors
        # Examples:
        # 1. Update records of rejected doctors
        # 2. Send notifications to medical team
        # 3. Update analytics/metrics
        
        # For now, just log the event
        logger.info(f"❌ Doctor rejected in medical service: {name} ({email}) - Reason: {reason}")
        
        return {"status": "processed", "user_id": user_id}

    except Exception as exc:
        logger.error(f"Failed to handle doctor_rejected event: {exc}")
        raise self.retry(exc=exc)