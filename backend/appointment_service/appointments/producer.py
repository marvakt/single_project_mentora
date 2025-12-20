"""
Event publisher for appointment_service V1.

Publishes RabbitMQ events for appointment lifecycle:
- appointment_created
- appointment_cancelled
- appointment_paid
"""
from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(
    name="appointments.publish_appointment_created",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
    retry_backoff=True,
    queue="appointment_created",
    routing_key="appointment_created",
)
def publish_appointment_created(
    self,
    appointment_id: str,
    user_id: str,
    doctor_id: str,
    scheduled_at: str,
    status: str,
):
    """
    Publishes appointment_created event to RabbitMQ queue.

    V1: Minimal event payload for appointment creation.
    Payload: appointment_id, user_id, doctor_id, scheduled_at, status
    """
    try:
        event_payload = {
            "appointment_id": appointment_id,
            "user_id": user_id,
            "doctor_id": doctor_id,
            "scheduled_at": scheduled_at,
            "status": status,
        }

        logger.info(f"Published appointment_created event: {appointment_id}")
        return event_payload

    except Exception as exc:
        logger.error(f"Failed to publish appointment_created: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name="appointments.publish_appointment_cancelled",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
    retry_backoff=True,
    queue="appointment_cancelled",
    routing_key="appointment_cancelled",
)
def publish_appointment_cancelled(
    self,
    appointment_id: str,
    user_id: str,
    doctor_id: str,
    scheduled_at: str,
    status: str,
):
    """
    Publishes appointment_cancelled event to RabbitMQ queue.

    V1: Minimal event payload for appointment cancellation.
    Payload: appointment_id, user_id, doctor_id, scheduled_at, status
    """
    try:
        event_payload = {
            "appointment_id": appointment_id,
            "user_id": user_id,
            "doctor_id": doctor_id,
            "scheduled_at": scheduled_at,
            "status": status,
        }

        logger.info(f"Published appointment_cancelled event: {appointment_id}")
        return event_payload

    except Exception as exc:
        logger.error(f"Failed to publish appointment_cancelled: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name="appointments.publish_appointment_paid",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
    retry_backoff=True,
    queue="appointment_paid",
    routing_key="appointment_paid",
)
def publish_appointment_paid(
    self,
    appointment_id: str,
    user_id: str,
    doctor_id: str,
    scheduled_at: str,
    payment_id: str,
    amount: str,
):
    """
    Publishes appointment_paid event to RabbitMQ queue.

    V1: Event payload for successful payment confirmation.
    Payload: appointment_id, user_id, doctor_id, scheduled_at, payment_id, amount
    """
    try:
        event_payload = {
            "appointment_id": appointment_id,
            "user_id": user_id,
            "doctor_id": doctor_id,
            "scheduled_at": scheduled_at,
            "payment_id": payment_id,
            "amount": amount,
        }

        logger.info(f"Published appointment_paid event: {appointment_id}")
        return event_payload

    except Exception as exc:
        logger.error(f"Failed to publish appointment_paid: {exc}")
        raise self.retry(exc=exc)
