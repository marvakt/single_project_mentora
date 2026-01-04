"""
profiles/tasks/mood_reminders.py - Daily mood reminder tasks using Celery
"""
import logging
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
from ..models import UserProfile, MoodEntry
from ..utils import publish_mood_event, analyze_mood_data, send_notifications

logger = logging.getLogger(__name__)


@shared_task
def send_daily_mood_reminders():
    """
    Send daily mood reminder notifications to all active users
    """
    logger.info("Starting daily mood reminder task")
    
    try:
        # Get all active users who should receive mood reminders
        active_users = UserProfile.objects.filter(
            receive_mood_notifications=True,
            status='active'
        )
        
        logger.info(f"Found {active_users.count()} users for mood reminders")
        
        successful_notifications = 0
        
        for user in active_users:
            try:
                # Send notification via SNS
                # NOTE: Logic seems to use mood_data as a wrapper for reminder info
                mood_data = {
                    'user_id': str(user.user_id),
                    'user_email': user.email,
                    'timestamp': timezone.now().isoformat(),
                    'reminder_type': 'daily_mood_collection'
                }
                
                # Publish to SQS for processing
                response = publish_mood_event(mood_data)
                
                if response:
                    # Also send SNS/Email notification
                    # Passing empty dict to analyze might trigger "concerning" logic if not careful, 
                    # but we are preserving original logic flow for now.
                    analysis_result = analyze_mood_data({})
                    
                    # We might want to adjust send_notifications to handle reminders gracefully
                    send_notifications(
                        mood_data, 
                        analysis_result, 
                        user.email
                    )
                    
                    successful_notifications += 1
                    
                    # Log the reminder
                    logger.info(f"Sent mood reminder to user {user.user_id} ({user.email})")
                
            except Exception as e:
                logger.error(f"Failed to send mood reminder to user {user.user_id}: {str(e)}")
                continue
        
        logger.info(f"Completed mood reminder task. Sent {successful_notifications} notifications")
        return f"Sent {successful_notifications} mood reminders"
        
    except Exception as e:
        logger.error(f"Error in daily mood reminder task: {str(e)}")
        return f"Error: {str(e)}"


@shared_task
def aggregate_daily_mood_data():
    """
    Aggregate daily mood data for doctor dashboards
    """
    logger.info("Starting daily mood aggregation task")
    
    try:
        # Get mood entries from the last 24 hours
        yesterday = timezone.now() - timedelta(days=1)
        recent_mood_entries = MoodEntry.objects.filter(
            created_at__gte=yesterday
        )
        
        # Group by doctor (patients' mood data for their doctors)
        doctor_aggregates = {}
        
        for entry in recent_mood_entries:
            # Get the user's assigned doctor (this might need adjustment based on your model)
            # For now, we'll just group by the user's doctor if they have one
            if hasattr(entry.user_profile, 'doctor'):
                doctor = entry.user_profile.doctor
                doctor_id = doctor.id
                
                if doctor_id not in doctor_aggregates:
                    doctor_aggregates[doctor_id] = {
                        'doctor_name': doctor.profile.name if doctor.profile else 'Unknown',
                        'patients_mood_data': [],
                        'average_mood': 0,
                        'concerning_cases': 0
                    }
                
                patient_data = {
                    'patient_name': entry.user_profile.name,
                    'mood_score': entry.mood_score,
                    'anxiety_level': entry.anxiety_level,
                    'timestamp': entry.created_at.isoformat(),
                    'notes': entry.notes
                }
                
                doctor_aggregates[doctor_id]['patients_mood_data'].append(patient_data)
                
                # Check if this is concerning
                if entry.mood_score <= 3 or entry.anxiety_level >= 8:
                    doctor_aggregates[doctor_id]['concerning_cases'] += 1
        
        # Calculate averages for each doctor
        for doctor_id, data in doctor_aggregates.items():
            if data['patients_mood_data']:
                total_mood = sum(p['mood_score'] for p in data['patients_mood_data'])
                data['average_mood'] = total_mood / len(data['patients_mood_data'])
        
        logger.info(f"Aggregated mood data for {len(doctor_aggregates)} doctors")
        return doctor_aggregates
        
    except Exception as e:
        logger.error(f"Error in daily mood aggregation task: {str(e)}")
        return {"error": str(e)}