# profiles/services.py
import json
import boto3
from django.conf import settings
from .models import DoctorProfile, DoctorDocument, DoctorAvailability, MoodEntry


def check_doctor_onboarding_complete(profile):
    try:
        doctor = DoctorProfile.objects.get(profile=profile)
    except DoctorProfile.DoesNotExist:
        return False

    has_docs = DoctorDocument.objects.filter(profile=profile).exists()
    has_availability = DoctorAvailability.objects.filter(profile=profile).exists()

    if (
        has_docs
        and has_availability
        and doctor.doctor_status == "approved"
    ):
        profile.onboarding_status = 100
        profile.save(update_fields=["onboarding_status"])
        return True

    return False


class MoodTrackingService:
    def __init__(self):
        # Initialize AWS clients
        self.sqs = boto3.client(
            'sqs',
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
        )
        
        self.s3 = boto3.client(
            's3',
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
        )
        
        self.ses = boto3.client(
            'ses',
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            region_name=getattr(settings, 'AWS_SES_REGION', 'us-east-1')  # SES is region-specific
        )
        
        self.sns = boto3.client(
            'sns',
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
        )
        
        self.sqs_queue_url = getattr(settings, 'MOOD_TRACKING_SQS_QUEUE_URL', None)
        self.s3_bucket_name = getattr(settings, 'MOOD_REPORTS_S3_BUCKET', 'mentora-mood-reports')
        self.sender_email = getattr(settings, 'SES_SENDER_EMAIL', 'noreply@mentora.com')
    
    def publish_mood_event(self, mood_data):
        """Publish mood event to SQS for processing by Lambda"""
        if not self.sqs_queue_url:
            print("SQS Queue URL not configured, skipping event publishing")
            return None
            
        try:
            message_body = json.dumps({
                'event_type': 'mood_entry',
                'data': mood_data,
                'timestamp': mood_data.get('created_at')
            })
            
            response = self.sqs.send_message(
                QueueUrl=self.sqs_queue_url,
                MessageBody=message_body
            )
            return response
        except Exception as e:
            print(f"Error publishing mood event: {str(e)}")
            return None
    
    def analyze_mood_data(self, mood_data):
        """Analyze mood data and determine if notifications are needed (this would typically be in Lambda)"""
        mood_score = mood_data.get('mood_score', 0)
        anxiety_level = mood_data.get('anxiety_level', 0)
        
        analysis = {
            'concerning': mood_score <= 3 or anxiety_level >= 8,
            'needs_attention': mood_score <= 4 or anxiety_level >= 7,
            'trend': 'declining' if mood_score < 5 else 'stable'
        }
        
        return analysis
    
    def send_notifications(self, mood_data, analysis_result, user_email):
        """Send notifications based on mood analysis (would typically be in Lambda)"""
        try:
            # Send email if concerning
            if analysis_result['concerning']:
                self.ses.send_email(
                    Source=self.sender_email,
                    Destination={'ToAddresses': [user_email]},
                    Message={
                        'Subject': {'Data': 'Mood Tracking Alert'},
                        'Body': {
                            'Text': {
                                'Data': f"Your mood score of {mood_data['mood_score']} indicates you may need support. Please reach out to your healthcare provider."
                            }
                        }
                    }
                )
            
            # Send general notification via SNS
            self.sns.publish(
                TopicArn=getattr(settings, 'MOOD_NOTIFICATION_TOPIC_ARN', ''),
                Message=f"New mood entry recorded. Score: {mood_data['mood_score']}/10",
                Subject='Mood Tracking Update'
            )
            
            return True
        except Exception as e:
            print(f"Error sending notifications: {str(e)}")
            return False
