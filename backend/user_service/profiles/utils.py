# profiles/utils.py
import uuid
import json
import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import timedelta
from django.utils import timezone


# ============================================================
# ID CONVERSION UTILITIES
# ============================================================
def convert_to_integer_id(id_value):
    """
    Convert various ID formats (UUID string, numeric string, integer) to integer.
    Returns the converted integer ID or the original value if conversion fails.
    """
    if isinstance(id_value, int):
        return id_value
    
    if isinstance(id_value, str):
        # Check if it's a UUID string (36 characters)
        if len(id_value) == 36:
            try:
                uuid_obj = uuid.UUID(id_value)
                return uuid_obj.int
            except ValueError:
                pass
        
        # Check if it's a numeric string
        if id_value.isdigit():
            return int(id_value)
    
    return id_value


def compare_user_ids(id1, id2):
    """
    Compare two user IDs regardless of their format (UUID string, numeric string, or integer).
    Returns True if they represent the same ID.
    """
    converted_id1 = convert_to_integer_id(id1)
    converted_id2 = convert_to_integer_id(id2)
    return converted_id1 == converted_id2


# ============================================================
# PERMISSION CHECK UTILITIES
# ============================================================
def check_profile_access_permission(requesting_user_id, profile):
    """
    Check if a user has permission to access a profile.
    Users can access:
    1. Their own profile
    2. Doctor profiles (for appointment functionality)
    
    Returns: (has_permission: bool, is_own_profile: bool, error_message: str)
    """
    is_own_profile = compare_user_ids(requesting_user_id, profile.user_id)
    is_doctor_profile = (profile.role == 'doctor')
    
    has_permission = is_own_profile or is_doctor_profile
    
    error_message = None
    if not has_permission:
        error_message = (
            f"Access denied. You can only access your own profile or doctor profiles. "
            f"Requested user_id: {profile.user_id}, Your user_id: {requesting_user_id}"
        )
    
    return has_permission, is_own_profile, error_message


def check_document_access_permission(requesting_user_id, user_role, document):
    """
    Check if a user has permission to access a doctor document.
    
    Returns: (has_permission: bool, error_message: str)
    """
    is_admin = user_role == 'admin'
    is_owner = (
        user_role == 'doctor' and 
        compare_user_ids(requesting_user_id, document.profile.user_id)
    )
    
    has_permission = is_admin or is_owner
    
    error_message = None
    if not has_permission:
        error_message = "You don't have permission to access this document"
    
    return has_permission, error_message


# ============================================================
# AWS S3 UTILITIES
# ============================================================
def get_s3_client():
    """Get configured S3 client."""
    return boto3.client(
        's3',
        aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
        aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
    )


def upload_file_to_s3(file, user_id, doc_type):
    """
    Upload a file to S3 and return the file URL and key.
    
    Args:
        file: Django UploadedFile object
        user_id: User ID for organizing files
        doc_type: Type of document
    
    Returns:
        tuple: (file_url, file_key) or (None, None) if upload fails
    
    Raises:
        Exception: If upload fails
    """
    file_extension = file.name.split('.')[-1] if '.' in file.name else 'bin'
    unique_filename = f"doctor_documents/{user_id}/{doc_type}_{uuid.uuid4().hex}.{file_extension}"
    
    s3_client = get_s3_client()
    bucket_name = getattr(settings, 'MOOD_REPORTS_S3_BUCKET', 'mentora-mood-reports')
    
    s3_client.upload_fileobj(
        file,
        bucket_name,
        unique_filename,
        ExtraArgs={
            'ContentType': file.content_type if hasattr(file, 'content_type') else 'application/octet-stream',
            'ACL': 'private'
        }
    )
    
    file_url = f"https://{bucket_name}.s3.amazonaws.com/{unique_filename}"
    
    return file_url, unique_filename


def generate_presigned_url(file_key, expiration=3600):
    """
    Generate a presigned URL for accessing an S3 object.
    
    Args:
        file_key: S3 object key
        expiration: URL expiration time in seconds (default: 1 hour)
    
    Returns:
        str: Presigned URL
    
    Raises:
        Exception: If URL generation fails
    """
    s3_client = get_s3_client()
    bucket_name = getattr(settings, 'MOOD_REPORTS_S3_BUCKET', 'mentora-mood-reports')
    
    presigned_url = s3_client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': bucket_name,
            'Key': file_key
        },
        ExpiresIn=expiration
    )
    
    return presigned_url


# ============================================================
# DOCTOR PROFILE UTILITIES
# ============================================================
def check_doctor_profile_completion(doctor_profile, user_profile):
    """
    Check if doctor profile is complete.
    
    Returns:
        tuple: (is_complete: bool, was_incomplete: bool)
    """
    was_incomplete = not (
        doctor_profile.specialization and 
        user_profile.name and 
        user_profile.phone
    )
    
    is_complete = (
        doctor_profile.specialization and 
        user_profile.name and 
        user_profile.phone
    )
    
    return is_complete, was_incomplete


def update_onboarding_status(user_profile, is_complete):
    """Update user onboarding status if profile is complete."""
    if is_complete:
        user_profile.onboarding_status = 100
        user_profile.save(update_fields=['onboarding_status'])


def should_notify_admin(doctor_profile, was_incomplete, is_now_complete):
    """
    Determine if admin should be notified about doctor profile completion.
    
    Returns:
        bool: True if admin should be notified
    """
    return (
        doctor_profile.doctor_status == 'pending' and 
        was_incomplete and 
        is_now_complete
    )


def auto_approve_doctor_if_enabled(doctor_profile, user_profile):
    """
    Auto-approve doctor if AUTO_APPROVE_DOCTORS setting is enabled.
    
    Returns:
        bool: True if doctor was auto-approved
    """
    import os
    auto_approve_enabled = os.getenv('AUTO_APPROVE_DOCTORS', 'False').lower() == 'true'
    
    if auto_approve_enabled:
        doctor_profile.doctor_status = 'approved'
        doctor_profile.save()
        print(f"DEBUG: Auto-approved doctor {user_profile.user_id} based on AUTO_APPROVE_DOCTORS setting")
        return True
    
    return False


# ============================================================
# DOCTOR AVAILABILITY UTILITIES
# ============================================================
def check_doctor_availability(profile):
    """
    Check if doctor is available for appointments.
    
    Returns:
        dict: Availability status information
    """
    try:
        doctor_profile = profile.doctor
    except AttributeError:
        return {
            'approved': False,
            'available': False,
            'onboarded': False,
            'has_availability': False
        }
    
    is_approved = doctor_profile.doctor_status == "approved"
    is_onboarded = profile.onboarding_status == 100
    has_availability = profile.availability.exists()
    is_available = is_approved and is_onboarded and has_availability
    
    return {
        'approved': is_approved,
        'available': is_available,
        'onboarded': is_onboarded,
        'has_availability': has_availability,
        'consultation_fee': doctor_profile.consultation_fee,
        'name': profile.name or profile.email
    }


# ============================================================
# DOCTOR MATCHING UTILITIES
# ============================================================
def calculate_severity_level(severity_score):
    """
    Calculate severity level from severity score.
    
    Args:
        severity_score: Integer from 0-10
    
    Returns:
        str: Severity level (LOW, MODERATE, HIGH, CRITICAL)
    """
    if severity_score <= 3:
        return 'LOW'
    elif severity_score <= 6:
        return 'MODERATE'
    elif severity_score <= 8:
        return 'HIGH'
    else:
        return 'CRITICAL'


def get_doctors_by_severity(severity_level):
    """
    Get doctors filtered by severity level.
    
    Args:
        severity_level: Severity level string
    
    Returns:
        QuerySet: Filtered doctor profiles
    """
    from .models import DoctorProfile
    
    base_query = DoctorProfile.objects.all().select_related("profile")
    
    if severity_level == 'LOW':
        doctors = base_query.filter(
            Q(specialization__icontains="counselor") | 
            Q(specialization__icontains="therapist") |
            Q(specialization__icontains="psychologist")
        )
    elif severity_level == 'MODERATE':
        doctors = base_query.filter(
            Q(specialization__icontains="psychologist") |
            Q(specialization__icontains="therapist")
        )
    else:  # HIGH or CRITICAL
        doctors = base_query.filter(
            Q(specialization__icontains="psychiatrist") |
            Q(specialization__icontains="clinical")
        )
    
    # Fallback: If no specialists found, show all doctors
    if not doctors.exists():
        doctors = base_query
    
    return doctors


def calculate_doctor_match_score(doctor, triage_profile=None):
    """
    Calculate match score for a doctor based on triage profile and availability.
    
    Args:
        doctor: DoctorProfile instance
        triage_profile: Optional triage profile for specialized matching
    
    Returns:
        dict: Score breakdown
    """
    if triage_profile:
        # Use the new algorithm based on triage profile
        # Specialty-symptom relevance: 40%
        specialty_relevance_score = calculate_specialty_relevance(doctor, triage_profile)
        specialty_score = specialty_relevance_score * 0.4
        
        # Urgency fit (availability vs urgency): 25%
        urgency_score = calculate_urgency_fit(doctor, triage_profile) * 0.25
        
        # Experience with similar cases: 20%
        experience_score = calculate_experience_fit(doctor, triage_profile) * 0.2
        
        # Rating (soft signal): 15%
        rating_score = (doctor.average_rating / 5.0) * 0.15 if doctor.average_rating else 0
        
        total_score = specialty_score + urgency_score + experience_score + rating_score
    else:
        # Fallback to old algorithm for backward compatibility
        # Rating score (weight: 0.6)
        rating_score = doctor.average_rating * 0.6 if doctor.average_rating else 0
        
        # Experience score (weight: 0.3)
        # Normalize experience to 0-1 scale (assuming max experience of 50 years)
        experience_score = min(doctor.experience_years / 50.0, 1.0) * 0.3
        
        # Availability score (weight: 0.1)
        availability_slots = doctor.profile.availability.count()
        availability_score = min(availability_slots / 20.0, 1.0) * 0.1
        
        total_score = rating_score + experience_score + availability_score
        
        return {
            'doctor': doctor,
            'score': total_score,
            'rating_score': rating_score,
            'experience_score': experience_score,
            'availability_score': availability_score
        }
    
    return {
        'doctor': doctor,
        'score': total_score,
        'specialty_score': specialty_score,
        'urgency_score': urgency_score,
        'experience_score': experience_score,
        'rating_score': rating_score,
        'triage_based': True
    }


def calculate_specialty_relevance(doctor, triage_profile):
    """
    Calculate how well the doctor's specialty matches the patient's symptoms.
    
    Args:
        doctor: DoctorProfile instance
        triage_profile: Triage profile with dominant symptoms
    
    Returns:
        float: Relevance score (0.0 to 1.0)
    """
    specialty = doctor.specialization.lower() if doctor.specialization else ""
    dominant_symptoms = triage_profile.get('dominant_symptoms', [])
    urgency_level = triage_profile.get('urgency_level', 'routine')
    
    # Check if doctor specialty matches required specialist type
    required_specialist = triage_profile.get('specialist_type', 'counselor')
    
    # High relevance if specialty matches required type
    if required_specialist in specialty:
        base_score = 1.0
    elif 'psychiatrist' in specialty and required_specialist in ['psychologist', 'counselor']:
        base_score = 0.9  # Psychiatrist can handle any case
    elif 'psychologist' in specialty and required_specialist == 'counselor':
        base_score = 0.8  # Psychologist can handle counselor cases
    else:
        base_score = 0.3  # Lower relevance for mismatch
    
    # Boost score if doctor treats dominant symptoms
    if dominant_symptoms:
        symptom_match_bonus = 0
        for symptom in dominant_symptoms:
            if symptom in ['mood', 'anxiety'] and any(s in specialty for s in ['mood', 'anxiety', 'depression', 'psychology']):
                symptom_match_bonus += 0.1
            elif symptom in ['sleep'] and any(s in specialty for s in ['sleep', 'behavioral', 'cognitive']):
                symptom_match_bonus += 0.05
            elif symptom in ['concentration'] and any(s in specialty for s in ['adhd', 'cognitive', 'behavioral']):
                symptom_match_bonus += 0.05
        
        base_score = min(1.0, base_score + symptom_match_bonus)
    
    return base_score


def calculate_urgency_fit(doctor, triage_profile):
    """
    Calculate how well the doctor's availability matches the patient's urgency.
    
    Args:
        doctor: DoctorProfile instance
        triage_profile: Triage profile with urgency level
    
    Returns:
        float: Urgency fit score (0.0 to 1.0)
    """
    urgency_level = triage_profile.get('urgency_level', 'routine')
    availability_count = doctor.profile.availability.count()
    
    # Urgency thresholds
    if urgency_level == 'immediate':
        # For immediate urgency, prioritize doctors with availability
        return 1.0 if availability_count > 0 else 0.1
    elif urgency_level == 'urgent':
        # For urgent cases, high availability is important
        return min(1.0, availability_count / 10.0)  # Scale with availability
    elif urgency_level == 'soon':
        # For soon cases, moderate availability is good
        return min(1.0, availability_count / 5.0)
    else:  # routine
        # For routine cases, any availability is acceptable
        return 0.8 if availability_count > 0 else 0.2


def calculate_experience_fit(doctor, triage_profile):
    """
    Calculate how well the doctor's experience matches the patient's needs.
    
    Args:
        doctor: DoctorProfile instance
        triage_profile: Triage profile with severity and symptoms
    
    Returns:
        float: Experience fit score (0.0 to 1.0)
    """
    severity_level = triage_profile.get('severity_level', 'minimal')
    experience_years = doctor.experience_years
    red_flags = triage_profile.get('red_flags', {})
    
    # Higher experience is better for severe cases
    if severity_level in ['severe', 'moderately_severe']:
        if experience_years >= 10:
            return 1.0
        elif experience_years >= 5:
            return 0.8
        elif experience_years >= 2:
            return 0.6
        else:
            return 0.4
    elif severity_level == 'moderate':
        if experience_years >= 5:
            return 1.0
        elif experience_years >= 2:
            return 0.7
        else:
            return 0.5
    else:  # mild, minimal
        if experience_years >= 2:
            return 0.8
        else:
            return 0.6
    
    # If there are red flags, prioritize more experienced doctors
    if red_flags.get('high_risk') and experience_years < 5:
        return max(0.3, experience_years / 10.0)


def get_top_matched_doctors(doctors, limit=5, triage_profile=None):
    """
    Score and sort doctors, returning top matches.
    
    Args:
        doctors: QuerySet of DoctorProfile objects
        limit: Number of top doctors to return
        triage_profile: Optional triage profile for specialized matching
    
    Returns:
        list: Top matched doctors with scores
    """
    if triage_profile:
        scored_doctors = [calculate_doctor_match_score(doctor, triage_profile) for doctor in doctors]
    else:
        scored_doctors = [calculate_doctor_match_score(doctor) for doctor in doctors]
    scored_doctors.sort(key=lambda x: x['score'], reverse=True)
    return scored_doctors[:limit]


# ============================================================
# MOOD TRACKING UTILITIES
# ============================================================
def calculate_mood_trend(mood_entries):
    """
    Calculate mood trend based on mood entries.
    
    Args:
        mood_entries: List or QuerySet of MoodEntry objects
    
    Returns:
        str: Trend indicator (improving, declining, stable, insufficient_data)
    """
    entries_list = list(mood_entries)
    
    if len(entries_list) < 2:
        return 'insufficient_data'
    
    # Compare last 3 vs first 3 entries
    recent_entries = entries_list[:3]
    older_entries = entries_list[-3:]
    
    if len(recent_entries) >= 1 and len(older_entries) >= 1:
        recent_avg = sum(e.mood_score for e in recent_entries) / len(recent_entries)
        older_avg = sum(e.mood_score for e in older_entries) / len(older_entries)
        
        if recent_avg > older_avg + 1:
            return 'improving'
        elif recent_avg < older_avg - 1:
            return 'declining'
        else:
            return 'stable'
    
    return 'insufficient_data'


def calculate_average_mood_metrics(mood_entries):
    """
    Calculate average mood metrics from mood entries.
    
    Args:
        mood_entries: QuerySet of MoodEntry objects
    
    Returns:
        dict: Average metrics
    """
    if mood_entries.count() == 0:
        return {
            'average_mood_score': 0,
            'average_anxiety_level': 0,
            'average_energy_level': 0,
            'total_entries': 0
        }
    
    avg_mood = sum(entry.mood_score for entry in mood_entries) / mood_entries.count()
    avg_anxiety = sum(entry.anxiety_level for entry in mood_entries) / mood_entries.count()
    avg_energy = sum(entry.energy_level for entry in mood_entries) / mood_entries.count()
    
    return {
        'average_mood_score': round(avg_mood, 2),
        'average_anxiety_level': round(avg_anxiety, 2),
        'average_energy_level': round(avg_energy, 2),
        'total_entries': mood_entries.count()
    }


def format_mood_entry_data(entry):
    """
    Format a mood entry for API response.
    
    Args:
        entry: MoodEntry object
    
    Returns:
        dict: Formatted mood entry data
    """
    return {
        'date': entry.created_at.strftime('%Y-%m-%d %H:%M'),
        'mood_score': entry.mood_score,
        'anxiety_level': entry.anxiety_level,
        'energy_level': entry.energy_level,
        'sleep_hours': entry.sleep_hours,
        'notes': entry.notes,
        'is_concerning': entry.mood_score <= 3 or entry.anxiety_level >= 8
    }


def calculate_patient_mood_statistics(mood_entries):
    """
    Calculate comprehensive mood statistics for a patient.
    
    Args:
        mood_entries: QuerySet of MoodEntry objects
    
    Returns:
        dict: Patient mood statistics
    """
    if not mood_entries:
        return {
            'total_entries': 0,
            'average_mood': 0,
            'average_anxiety': 0,
            'concerning_entries_count': 0,
            'mood_trend': 'no_data',
        }
    
    mood_entries_list = [format_mood_entry_data(e) for e in mood_entries]
    
    total_mood = sum(e.mood_score for e in mood_entries)
    total_anxiety = sum(e.anxiety_level for e in mood_entries)
    concerning_entries = [e for e in mood_entries if e.mood_score <= 3 or e.anxiety_level >= 8]
    entry_count = len(mood_entries)
    
    return {
        'total_entries': entry_count,
        'average_mood': round(total_mood / entry_count, 2) if entry_count > 0 else 0,
        'average_anxiety': round(total_anxiety / entry_count, 2) if entry_count > 0 else 0,
        'concerning_entries_count': len(concerning_entries),
        'mood_trend': calculate_mood_trend(mood_entries_list),
    }


# ============================================================
# MOOD TRACKING SERVICE UTILITIES
# ============================================================
def get_sqs_client():
    """Get configured SQS client."""
    return boto3.client(
        'sqs',
        aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
        aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
    )


def publish_mood_event(mood_data):
    """
    Publish mood event to SQS for processing by Lambda.
    
    Args:
        mood_data: Dictionary containing mood entry data
    
    Returns:
        SQS response or None if queue not configured
    """
    sqs_queue_url = getattr(settings, 'MOOD_TRACKING_SQS_QUEUE_URL', None)
    
    if not sqs_queue_url:
        print("SQS Queue URL not configured, skipping event publishing")
        return None
    
    try:
        sqs_client = get_sqs_client()
        
        message_body = json.dumps({
            'event_type': 'mood_entry',
            'data': mood_data,
            'timestamp': mood_data.get('created_at')
        })
        
        response = sqs_client.send_message(
            QueueUrl=sqs_queue_url,
            MessageBody=message_body
        )
        
        return response
    except Exception as e:
        print(f"Error publishing mood event: {str(e)}")
        return None

def get_ses_client():
    """Get configured SES client."""
    return boto3.client(
        'ses',
        aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
        aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        region_name=getattr(settings, 'AWS_SES_REGION', 'us-east-1')
    )

def get_sns_client():
    """Get configured SNS client."""
    return boto3.client(
        'sns',
        aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
        aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
    )

def analyze_mood_data(mood_data):
    """Analyze mood data and determine if notifications are needed (typically via Lambda)"""
    mood_score = mood_data.get('mood_score', 0)
    anxiety_level = mood_data.get('anxiety_level', 0)
    
    analysis = {
        'concerning': mood_score <= 3 or anxiety_level >= 8,
        'needs_attention': mood_score <= 4 or anxiety_level >= 7,
        'trend': 'declining' if mood_score < 5 else 'stable'
    }
    return analysis

def send_notifications(mood_data, analysis_result, user_email):
    """Send notifications based on mood analysis"""
    sender_email = getattr(settings, 'SES_SENDER_EMAIL', 'noreply@mentora.com')
    try:
        # Send email if concerning
        if analysis_result.get('concerning'):
            ses = get_ses_client()
            ses.send_email(
                Source=sender_email,
                Destination={'ToAddresses': [user_email]},
                Message={
                    'Subject': {'Data': 'Mood Tracking Alert'},
                    'Body': {
                        'Text': {
                            'Data': f"Your mood score of {mood_data.get('mood_score')} indicates you may need support. Please reach out to your healthcare provider."
                        }
                    }
                }
            )
        
        # Send general notification via SNS
        sns = get_sns_client()
        topic_arn = getattr(settings, 'MOOD_NOTIFICATION_TOPIC_ARN', '')
        if topic_arn:
            sns.publish(
                TopicArn=topic_arn,
                Message=f"New mood entry recorded. Score: {mood_data.get('mood_score')}/10",
                Subject='Mood Tracking Update'
            )
        
        return True
    except Exception as e:
        print(f"Error sending notifications: {str(e)}")
        return False


# ============================================================
# QUERY UTILITIES
# ============================================================
def filter_users_by_search_and_role(search_query='', role_filter=None, status_filter=None):
    """
    Filter users by search query, role, and status.
    
    Args:
        search_query: Search string for name, email, or user_id
        role_filter: Role to filter by ('user', 'doctor', 'admin')
        status_filter: Status to filter by ('active', 'pending')
    
    Returns:
        QuerySet: Filtered user profiles
    """
    from .models import UserProfile
    
    queryset = UserProfile.objects.all()
    
    if search_query:
        queryset = queryset.filter(
            Q(name__icontains=search_query) |
            Q(email__icontains=search_query) |
            Q(user_id__icontains=search_query)
        )
    
    if role_filter and role_filter != "all":
        queryset = queryset.filter(role=role_filter)
    
    if status_filter == "active":
        queryset = queryset.filter(onboarding_status=100)
    elif status_filter == "pending":
        queryset = queryset.filter(onboarding_status__lt=100)
    
    return queryset.select_related('doctor')


# ============================================================
# VALIDATION UTILITIES
# ============================================================
def validate_severity_score(severity_score):
    """
    Validate severity score.
    
    Args:
        severity_score: Score to validate
    
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if not isinstance(severity_score, int) or severity_score < 0 or severity_score > 10:
        return False, "Severity score must be an integer between 0 and 10"
    return True, None


def validate_rating(rating):
    """
    Validate rating value.
    
    Args:
        rating: Rating to validate
    
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
        return False, "Rating must be an integer between 1 and 5"
    return True, None