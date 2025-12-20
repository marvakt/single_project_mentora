"""
Celery configuration for appointment service consumer.

This configuration is specifically designed for the consumer worker
to avoid issues with worker_state_db and other problematic settings.
"""
import os
from celery import Celery
from kombu import Queue

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "appointment_service.settings")

app = Celery("appointment_service_consumer")

# Load configuration from Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Override specific settings to avoid worker_state_db issues
app.conf.update(
    worker_state_db=None,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
)

# Queue configuration for events
app.conf.task_queues = (
    Queue("doctor_approved", routing_key="doctor_approved"),
    Queue("doctor_rejected", routing_key="doctor_rejected"),
)

app.conf.task_default_queue = "default"
app.conf.worker_state_db = None

# Explicitly include consumer tasks
from appointments import consumer
from appointments import producer
app.autodiscover_tasks()

if __name__ == "__main__":
    app.start()