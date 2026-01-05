import logging
from datetime import datetime, timedelta

from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)

User = get_user_model()


@shared_task(
    name="mood.send_daily_mood_notification",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 30},
    retry_backoff=True,
)
def send_daily_mood_notification(self, user_id):
    """
    Send daily mood notification to user to track their mood
    """
    try:
        user = User.objects.get(id=user_id)
        
        # Create a unique notification link for mood tracking
        # In a real implementation, this would be a link to the mood tracking page
        mood_tracking_url = f"https://mentora.com/user/mood-track?user_id={user_id}&date={timezone.now().date()}"
        
        subject = "Daily Mood Check-in 🌟"
        # Create direct API links for each mood option
        # In production, this would be the public API endpoint
        base_api_url = "https://mentora.com/api/v1/mood/quick-mood"
        
        message = f"""
Hello {user.get_full_name() or user.email},

How are you feeling today? We'd love to know your mood to help track your mental health journey.

Click on your mood to log it instantly:

😊 Happy: {base_api_url}?mood=happy
😌 Calm: {base_api_url}?mood=calm
😔 Sad: {base_api_url}?mood=sad
😠 Angry: {base_api_url}?mood=angry
😰 Anxious: {base_api_url}?mood=anxious
😴 Tired: {base_api_url}?mood=tired
😄 Excited: {base_api_url}?mood=excited
😢 Upset: {base_api_url}?mood=upset

Your mood tracking helps us provide better insights and support for your mental wellness.

Best regards,
Mentora Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        logger.info(f"Daily mood notification sent to user {user_id} ({user.email})")
        return {"status": "sent", "user_id": user_id}
    
    except User.DoesNotExist:
        logger.error(f"User {user_id} does not exist for mood notification")
        return {"status": "error", "reason": "user_not_found", "user_id": user_id}
    
    except Exception as exc:
        logger.error(f"Failed to send mood notification to user {user_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name="mood.send_daily_mood_notifications_batch",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 2, "countdown": 60},
    retry_backoff=True,
)
def send_daily_mood_notifications_batch(self):
    """
    Send daily mood notifications to all active users
    """
    try:
        # Get all active users who should receive mood notifications
        active_users = User.objects.filter(
            is_active=True,
            is_staff=False,
            is_superuser=False,
            profile__receive_mood_notifications=True  # Assuming this field exists
        ).values_list('id', flat=True)
        
        sent_count = 0
        for user_id in active_users:
            send_daily_mood_notification.delay(user_id)
            sent_count += 1
        
        logger.info(f"Daily mood notifications batch sent to {sent_count} users")
        return {"status": "completed", "sent_count": sent_count}
    
    except Exception as exc:
        logger.error(f"Failed to send mood notifications batch: {exc}")
        raise self.retry(exc=exc)