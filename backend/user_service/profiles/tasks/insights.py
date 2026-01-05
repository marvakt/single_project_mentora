import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 30},
    retry_backoff=True,
    name="profiles.send_weekly_insight_email",
)
def send_weekly_insight_email(self, email: str, insight: str):
    send_mail(
        "Your Weekly Mental Health Insight",
        insight,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )

    logger.info(f"Weekly insight sent to {email}")
    return True
