import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)



@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 10},
    retry_backoff=True,
    name="profiles.send_doctor_status_email",
)
def send_doctor_status_email(self, email: str, status: str):
    from ..integrations.fcm_notify import send_fcm_notification
    from ..models import UserProfile
    
    # Fetch user profile to get FCM token
    user_profile = UserProfile.objects.filter(email=email).first()
    
    if not user_profile or not user_profile.fcm_token:
        logger.warning(f"Cannot send FCM status update: No token for {email}")
        return False

    if status == "approved":
        title = "🎉 Profile Approved"
        body = "Congratulations! Your doctor profile has been approved. You can now accept appointments."
    else:
        title = "❌ Profile Rejected"
        body = "Your doctor profile was rejected. Please contact support to reapply."

    result = send_fcm_notification(user_profile.fcm_token, title, body)
    if result:
        logger.info(f"Doctor status notification sent via FCM to {email}")
    return result


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 10},
    retry_backoff=True,
    name="profiles.notify_admin_new_doctor",
)
def notify_admin_new_doctor(self, doctor_name: str, doctor_email: str, doctor_id: int):
    # Log information for admin (FCM doesn't have a direct admin broadcast without a token)
    logger.critical(
        f"ADMIN NOTIFICATION: New Doctor Registered | "
        f"Name: {doctor_name} | Email: {doctor_email} | ID: {doctor_id}"
    )
    return True

