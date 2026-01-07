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
    from ..integrations.fcm_notify import send_fcm_notification
    from ..models import UserProfile
    
    # Fetch user profile to get FCM token
    user_profile = UserProfile.objects.filter(email=email).first()
    
    if not user_profile or not user_profile.fcm_token:
        logger.warning(f"Cannot send FCM insight: No token for {email}")
        return False

    title = "📈 Your Weekly Mental Health Insight"
    body = insight

    result = send_fcm_notification(user_profile.fcm_token, title, body)
    if result:
        logger.info(f"Weekly insight notification sent via FCM to {email}")
    return result

