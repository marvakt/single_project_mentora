"""
Event producer for user_service.

Publishes RabbitMQ events for user/doctor lifecycle events.
"""
from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(
    name="profiles.publish_doctor_approved",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
    retry_backoff=True,
    queue="doctor_approved",
    routing_key="doctor_approved",
)
def publish_doctor_approved(
    self,
    user_id: int,
    email: str,
    name: str,
    specialization: str,
):
    """
    Publishes doctor_approved event to RabbitMQ queue.
    
    Payload: user_id, email, name, specialization
    """
    try:
        event_payload = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "specialization": specialization,
            "event_type": "doctor_approved"
        }

        logger.info(f"Published doctor_approved event for user_id: {user_id}")
        return event_payload

    except Exception as exc:
        logger.error(f"Failed to publish doctor_approved event: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name="profiles.publish_doctor_rejected",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
    retry_backoff=True,
    queue="doctor_rejected",
    routing_key="doctor_rejected",
)
def publish_doctor_rejected(
    self,
    user_id: int,
    email: str,
    name: str,
    reason: str,
):
    """
    Publishes doctor_rejected event to RabbitMQ queue.
    
    Payload: user_id, email, name, reason
    """
    try:
        event_payload = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "reason": reason,
            "event_type": "doctor_rejected"
        }

        logger.info(f"Published doctor_rejected event for user_id: {user_id}")
        return event_payload

    except Exception as exc:
        logger.error(f"Failed to publish doctor_rejected event: {exc}")
        raise self.retry(exc=exc)