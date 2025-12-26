import requests
from django.conf import settings
from django.utils import timezone


# ---------- VALIDATION HELPERS ----------

def is_valid_status_transition(old, new):
    allowed = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
    }
    return new in allowed.get(old, [])


# ---------- USER SERVICE INTEGRATION ----------

class UserServiceError(Exception):
    pass


class MedicalServiceError(Exception):
    pass


def fetch_doctor_availability_and_fee(doctor_id):
    """
    Synchronous call to user_service.
    Required for booking decision.
    """
    try:
        headers = {
            "X-INTERNAL-TOKEN": getattr(settings, "INTERNAL_SERVICE_TOKEN", "dev-internal")
        }
        response = requests.get(
            f"{settings.USER_SERVICE_BASE_URL}/internal/doctors/{doctor_id}/availability/",
            headers=headers,
            timeout=3
        )
    except requests.RequestException:
        raise UserServiceError("User service unavailable")

    if response.status_code != 200:
        raise UserServiceError(f"Failed to fetch doctor data (Status: {response.status_code}, Body: {response.text})")

    data = response.json()

    if not data.get("approved"):
        raise UserServiceError("Doctor is not approved")

    if not data.get("available"):
        raise UserServiceError("Doctor is not available")

    return data


def fetch_user_severity_level(user_id, auth_header):
    """
    Fetch user's latest severity level from medical_service.
    Used for priority-based appointment scheduling.
    """
    try:
        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }
        response = requests.get(
            f"{settings.MEDICAL_SERVICE_BASE_URL}/questionnaire/latest",
            headers=headers,
            timeout=3
        )
    except requests.RequestException as e:
        raise MedicalServiceError(f"Medical service unavailable: {str(e)}")

    if response.status_code != 200:
        raise MedicalServiceError(f"Failed to fetch severity data: {response.status_code}")

    data = response.json()
    return {
        "raw_score": data.get("score"),
        "severity_level": data.get("severity_level"),
        "timestamp": data.get("timestamp")
    }


def get_available_slots_for_date(doctor_id, date):
    """
    Get available time slots for a specific doctor on a specific date.
    Excludes already booked slots (pending and confirmed appointments).
    """
    from .models import Appointment
    from django.db.models import Q
    import datetime
    
    # Get all appointments for the doctor on the given date that are pending or confirmed
    booked_slots = Appointment.objects.filter(
        doctor_id=doctor_id,
        scheduled_at__date=date,
        status__in=["pending", "confirmed"]
    ).values_list('scheduled_at__time', flat=True)
    
    # Get doctor's availability for that day
    try:
        doctor_data = fetch_doctor_availability_and_fee(doctor_id)
        start_time = doctor_data.get("start_time")
        end_time = doctor_data.get("end_time")
        slot_duration = doctor_data.get("slot_duration", 30)  # in minutes
    except UserServiceError:
        # If we can't get doctor availability, return empty list
        return []
    
    # Parse start and end times
    try:
        start_parts = start_time.split(':')
        start_hour = int(start_parts[0])
        start_minute = int(start_parts[1])
        
        end_parts = end_time.split(':')
        end_hour = int(end_parts[0])
        end_minute = int(end_parts[1])
    except (ValueError, IndexError):
        return []
    
    # Generate all possible slots in 30-minute intervals
    available_slots = []
    current_time = datetime.time(start_hour, start_minute)
    
    while True:
        # Convert current_time to string format for comparison
        current_time_str = current_time.strftime('%H:%M:%S')
        
        # Check if this time slot is already booked
        if current_time_str not in booked_slots:
            available_slots.append(current_time.strftime('%H:%M'))
        
        # Increment by slot duration
        total_minutes = current_time.hour * 60 + current_time.minute + slot_duration
        if total_minutes >= 24 * 60:  # More than 24 hours
            break
        
        new_hour = total_minutes // 60
        new_minute = total_minutes % 60
        
        if new_hour > end_hour or (new_hour == end_hour and new_minute > end_minute):
            break
            
        current_time = datetime.time(new_hour, new_minute)
    
    return available_slots