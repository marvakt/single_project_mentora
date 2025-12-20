"""
Consumer runner for medical_service.

This script runs the Celery worker that consumes events from RabbitMQ.
"""
import os
import sys
from celery import Celery

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

# Import the consumer
from app.messaging.consumer import celery_app

if __name__ == "__main__":
    # Start the Celery worker
    celery_app.worker_main([
        "worker",
        "--loglevel=info",
        "--queues=doctor_approved,doctor_rejected",
        "--hostname=medical_service_consumer@%h"
    ])