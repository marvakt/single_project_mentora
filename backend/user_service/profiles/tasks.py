from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 10},
    retry_backoff=True,
    name="profiles.send_doctor_status_email",
)
def send_doctor_status_email(self, email: str, status: str):
    """
    Sends email when doctor is approved/rejected
    """
    try:
        subject = f"Doctor Verification: {status.title()}"
        message = f"Your doctor profile has been {status}."

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

        logger.info(f"Doctor status email sent to {email} ({status})")
        return True

    except Exception as exc:
        logger.error(f"Doctor status email failed for {email}: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 30},
    retry_backoff=True,
    name="profiles.send_weekly_insight_email",
)
def send_weekly_insight_email(self, email: str, insight: str):
    """
    Sends weekly mental health insight email
    """
    try:
        subject = "Your Weekly Mental Health Insight"

        send_mail(
            subject,
            insight,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

        logger.info(f"Weekly insight email sent to {email}")
        return True

    except Exception as exc:
        logger.error(f"Weekly insight email failed for {email}: {exc}")
        raise self.retry(exc=exc)


@shared_task(name="profiles.healthcheck")
def celery_healthcheck():
    """
    Simple task to confirm Celery worker is alive
    """
    return "CELERY OK"
