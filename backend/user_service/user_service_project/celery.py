import os
from celery import Celery
from datetime import timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "user_service_project.settings")

app = Celery("user_service")

app.config_from_object("django.conf:settings", namespace="CELERY")

app.autodiscover_tasks()

# OPTIONAL: Log when Celery starts
@app.task(bind=True)
def debug_task(self):
    print(f"Celery debug task executed: {self.request!r}")
