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
    if status == "approved":
        subject = "🎉 Doctor Profile Approved"
        message = (
            "Congratulations!\n\n"
            "Your doctor profile has been approved.\n"
            "You can now accept appointments.\n\n"
            "— Mentora Team"
        )
    else:
        subject = "Doctor Profile Rejected"
        message = (
            "Your doctor profile was rejected.\n"
            "Please contact support to reapply.\n\n"
            "— Mentora Team"
        )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )

    logger.info(f"Doctor status email sent to {email} ({status})")
    return True


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 10},
    retry_backoff=True,
    name="profiles.notify_admin_new_doctor",
)
def notify_admin_new_doctor(self, doctor_name: str, doctor_email: str, doctor_id: int):
    subject = f"🆕 New Doctor Registration: {doctor_name}"
    message = (
        f"Doctor Name: {doctor_name}\n"
        f"Email: {doctor_email}\n"
        f"User ID: {doctor_id}\n\n"
        "Please review in admin panel."
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [settings.ADMIN_NOTIFICATION_EMAIL],
        fail_silently=False,
    )

    logger.info(f"Admin notified for doctor {doctor_email}")
    return True
