# """
# Event publisher for appointment_service V1.

# Publishes RabbitMQ events for appointment lifecycle:
# - appointment_created
# - appointment_cancelled
# - appointment_paid
# """
# from celery import shared_task
# import logging

# logger = logging.getLogger(__name__)


# @shared_task(
#     name="appointments.publish_appointment_created",
#     bind=True,
#     autoretry_for=(Exception,),
#     retry_kwargs={"max_retries": 3, "countdown": 5},
#     retry_backoff=True,
#     queue="appointment_created",
#     routing_key="appointment_created",
# )
# def publish_appointment_created(
#     self,
#     appointment_id: str,
#     user_id: str,
#     doctor_id: str,
#     scheduled_at: str,
#     status: str,
# ):
#     """
#     Publishes appointment_created event to RabbitMQ queue.

#     V1: Minimal event payload for appointment creation.
#     Payload: appointment_id, user_id, doctor_id, scheduled_at, status
#     """
#     try:
#         event_payload = {
#             "appointment_id": appointment_id,
#             "user_id": user_id,
#             "doctor_id": doctor_id,
#             "scheduled_at": scheduled_at,
#             "status": status,
#         }

#         logger.info(f"Published appointment_created event: {appointment_id}")
#         return event_payload

#     except Exception as exc:
#         logger.error(f"Failed to publish appointment_created: {exc}")
#         raise self.retry(exc=exc)


# @shared_task(
#     name="appointments.publish_appointment_cancelled",
#     bind=True,
#     autoretry_for=(Exception,),
#     retry_kwargs={"max_retries": 3, "countdown": 5},
#     retry_backoff=True,
#     queue="appointment_cancelled",
#     routing_key="appointment_cancelled",
# )
# def publish_appointment_cancelled(
#     self,
#     appointment_id: str,
#     user_id: str,
#     doctor_id: str,
#     scheduled_at: str,
#     status: str,
# ):
#     """
#     Publishes appointment_cancelled event to RabbitMQ queue.

#     V1: Minimal event payload for appointment cancellation.
#     Payload: appointment_id, user_id, doctor_id, scheduled_at, status
#     """
#     try:
#         event_payload = {
#             "appointment_id": appointment_id,
#             "user_id": user_id,
#             "doctor_id": doctor_id,
#             "scheduled_at": scheduled_at,
#             "status": status,
#         }

#         logger.info(f"Published appointment_cancelled event: {appointment_id}")
#         return event_payload

#     except Exception as exc:
#         logger.error(f"Failed to publish appointment_cancelled: {exc}")
#         raise self.retry(exc=exc)


# @shared_task(
#     name="appointments.publish_appointment_paid",
#     bind=True,
#     autoretry_for=(Exception,),
#     retry_kwargs={"max_retries": 3, "countdown": 5},
#     retry_backoff=True,
#     queue="appointment_paid",
#     routing_key="appointment_paid",
# )
# def publish_appointment_paid(
#     self,
#     appointment_id: str,
#     user_id: str,
#     doctor_id: str,
#     scheduled_at: str,
#     payment_id: str,
#     amount: str,
# ):
#     """
#     Publishes appointment_paid event to RabbitMQ queue.

#     V1: Event payload for successful payment confirmation.
#     Payload: appointment_id, user_id, doctor_id, scheduled_at, payment_id, amount
#     """
#     try:
#         event_payload = {
#             "appointment_id": appointment_id,
#             "user_id": user_id,
#             "doctor_id": doctor_id,
#             "scheduled_at": scheduled_at,
#             "payment_id": payment_id,
#             "amount": amount,
#         }

#         logger.info(f"Published appointment_paid event: {appointment_id}")
#         return event_payload

#     except Exception as exc:
#         logger.error(f"Failed to publish appointment_paid: {exc}")
#         raise self.retry(exc=exc)





"""
appointments/producer.py - UPDATED EVENT PRODUCER

Enhanced event publishing with medical service integration.
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
    severity_level: str = None,
    priority: str = "normal",
):
    """
    Publishes appointment_created event.
    
    Enhanced with severity and priority information.
    """
    try:
        event_payload = {
            "event_type": "appointment_created",
            "appointment_id": appointment_id,
            "user_id": user_id,
            "doctor_id": doctor_id,
            "scheduled_at": scheduled_at,
            "status": status,
            "severity_level": severity_level,
            "priority": priority,
        }

        logger.info(f"📅 Published appointment_created: {appointment_id} (priority: {priority})")
        return event_payload

    except Exception as exc:
        logger.error(f"❌ Failed to publish appointment_created: {exc}")
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
    Publishes appointment_cancelled event.
    
    Triggers notification to doctor and refund processing if applicable.
    """
    try:
        event_payload = {
            "event_type": "appointment_cancelled",
            "appointment_id": appointment_id,
            "user_id": user_id,
            "doctor_id": doctor_id,
            "scheduled_at": scheduled_at,
            "status": status,
        }

        logger.info(f"🚫 Published appointment_cancelled: {appointment_id}")
        return event_payload

    except Exception as exc:
        logger.error(f"❌ Failed to publish appointment_cancelled: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name="appointments.publish_appointment_completed",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
    retry_backoff=True,
    queue="appointment_completed",
    routing_key="appointment_completed",
)
def publish_appointment_completed(
    self,
    appointment_id: str,
    user_id: str,
    doctor_id: str,
    scheduled_at: str,
    status: str,
):
    """
    Publishes appointment_completed event.
    
    Triggers follow-up tasks and feedback requests.
    """
    try:
        event_payload = {
            "event_type": "appointment_completed",
            "appointment_id": appointment_id,
            "user_id": user_id,
            "doctor_id": doctor_id,
            "scheduled_at": scheduled_at,
            "status": status,
        }

        logger.info(f"✅ Published appointment_completed: {appointment_id}")
        return event_payload

    except Exception as exc:
        logger.error(f"❌ Failed to publish appointment_completed: {exc}")
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
    Publishes appointment_paid event.
    
    Confirms payment and triggers appointment confirmation.
    """
    try:
        event_payload = {
            "event_type": "appointment_paid",
            "appointment_id": appointment_id,
            "user_id": user_id,
            "doctor_id": doctor_id,
            "scheduled_at": scheduled_at,
            "payment_id": payment_id,
            "amount": amount,
        }

        logger.info(f"💳 Published appointment_paid: {appointment_id} (₹{amount})")
        return event_payload

    except Exception as exc:
        logger.error(f"❌ Failed to publish appointment_paid: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name="appointments.publish_appointment_reminder",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 2, "countdown": 60},
    retry_backoff=True,
    queue="appointment_reminders",
    routing_key="appointment_reminders",
)
def publish_appointment_reminder(
    self,
    appointment_id: str,
    user_id: str,
    doctor_id: str,
    scheduled_at: str,
):
    """
    Publishes appointment_reminder event.
    
    Sent 24 hours before scheduled appointment.
    """
    try:
        event_payload = {
            "event_type": "appointment_reminder",
            "appointment_id": appointment_id,
            "user_id": user_id,
            "doctor_id": doctor_id,
            "scheduled_at": scheduled_at,
        }

        logger.info(f"🔔 Published appointment_reminder: {appointment_id}")
        return event_payload

    except Exception as exc:
        logger.error(f"❌ Failed to publish appointment_reminder: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name="appointments.publish_feedback_submitted",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
    retry_backoff=True,
    queue="feedback_submitted",
    routing_key="feedback_submitted",
)
def publish_feedback_submitted(
    self,
    appointment_id: str,
    user_id: str,
    doctor_id: str,
    rating: int,
    feedback_id: str,
):
    """
    Publishes feedback_submitted event.
    
    Updates doctor ratings in user_service.
    """
    try:
        event_payload = {
            "event_type": "feedback_submitted",
            "appointment_id": appointment_id,
            "user_id": user_id,
            "doctor_id": doctor_id,
            "rating": rating,
            "feedback_id": feedback_id,
        }

        logger.info(f"⭐ Published feedback_submitted: {appointment_id} (rating: {rating}/5)")
        return event_payload

    except Exception as exc:
        logger.error(f"❌ Failed to publish feedback_submitted: {exc}")
        raise self.retry(exc=exc)