import os
from celery import Celery

RABBITMQ_URL = os.getenv("RABBITMQ_URL")

celery_app = Celery(
    "medical_service",
    broker=RABBITMQ_URL,
)
