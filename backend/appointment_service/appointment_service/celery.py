"""
Celery configuration for appointment_service V1.

Configures RabbitMQ broker for async event publishing.
"""
import os
from celery import Celery
from kombu import Queue

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "appointment_service.settings")

app = Celery("appointment_service")

app.config_from_object("django.conf:settings", namespace="CELERY")

# RabbitMQ queue configuration for events
app.conf.task_queues = (
    Queue("appointment_created", routing_key="appointment_created"),
    Queue("appointment_cancelled", routing_key="appointment_cancelled"),
    Queue("appointment_paid", routing_key="appointment_paid"),
    Queue("doctor_approved", routing_key="doctor_approved"),
    Queue("doctor_rejected", routing_key="doctor_rejected"),
)

app.conf.task_default_queue = "default"

# Explicitly include producer tasks
from appointments import producer
app.autodiscover_tasks()

