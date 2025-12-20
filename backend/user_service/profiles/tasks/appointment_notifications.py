from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(name="appointments.publish_appointment_created")
def handle_appointment_created(**data):
    logger.info(f"Appointment created: {data}")
    return True


@shared_task(name="appointments.publish_appointment_paid")
def handle_appointment_paid(**data):
    logger.info(f"Appointment paid: {data}")
    return True


@shared_task(name="appointments.publish_appointment_cancelled")
def handle_appointment_cancelled(**data):
    logger.info(f"Appointment cancelled: {data}")
    return True
