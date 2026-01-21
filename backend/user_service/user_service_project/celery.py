


import os

from celery import Celery
from kombu import Queue

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "user_service_project.settings")

app = Celery("user_service")

app.config_from_object("django.conf:settings", namespace="CELERY")

# MPORTANT: Explicit RabbitMQ queue binding
app.conf.task_queues = (
    Queue("default", routing_key="default"),
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
    # Daily mood reminders at 10:30 AM local (05:00 UTC)
    'send-daily-mood-reminders': {
        'task': 'profiles.send_daily_mood_reminders',
        'schedule': crontab(hour=5, minute=0),  # 05:00 UTC = 10:30 AM IST
    },

    # Daily mood aggregation at 11 AM UTC
    'aggregate-daily-mood-data': {
        'task': 'profiles.aggregate_daily_mood_data',
        'schedule': crontab(hour=11, minute=0),  # Every day at 11 AM UTC
    },
}


app.conf.timezone = 'UTC'

@app.task(bind=True)
def debug_task(self):
    print(f"Celery debug task executed: {self.request!r}")
