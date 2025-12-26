# import os
# from celery import Celery
# from datetime import timedelta

# os.environ.setdefault("DJANGO_SETTINGS_MODULE", "user_service_project.settings")

# app = Celery("user_service")

# app.config_from_object("django.conf:settings", namespace="CELERY")

# app.autodiscover_tasks()

# # OPTIONAL: Log when Celery starts
# @app.task(bind=True)
# def debug_task(self):
#     print(f"Celery debug task executed: {self.request!r}")


import os
from celery import Celery
from kombu import Queue

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "user_service_project.settings")

app = Celery("user_service")

app.config_from_object("django.conf:settings", namespace="CELERY")

# 🔥 IMPORTANT: Explicit RabbitMQ queue binding
app.conf.task_queues = (
    Queue("high_risk_alerts", routing_key="high_risk_alerts"),
    Queue("appointment_created", routing_key="appointment_created"),
    Queue("appointment_paid", routing_key="appointment_paid"),
    Queue("appointment_cancelled", routing_key="appointment_cancelled"),
)

app.conf.task_default_queue = "default"

app.autodiscover_tasks(["profiles"])

# Configure Celery Beat schedule for periodic tasks
from celery.schedules import crontab
app.conf.beat_schedule = {
    # Daily mood notifications at 9 AM UTC
    'send-daily-mood-notifications': {
        'task': 'mood.send_daily_mood_notifications_batch',
        'schedule': crontab(hour=9, minute=0),  # Every day at 9 AM UTC
    },
}

app.conf.timezone = 'UTC'

@app.task(bind=True)
def debug_task(self):
    print(f"Celery debug task executed: {self.request!r}")
