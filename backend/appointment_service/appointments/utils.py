# import requests
# from django.conf import settings
# from django.utils import timezone


# # ---------- VALIDATION HELPERS ----------

# def is_valid_status_transition(old, new):
#     allowed = {
#         'pending': ['confirmed', 'cancelled'],
#         'confirmed': ['completed', 'cancelled'],
#         'completed': [],
#         'cancelled': [],
#     }
#     return new in allowed.get(old, [])


# # ---------- USER SERVICE INTEGRATION ----------

# class UserServiceError(Exception):
#     pass


# class MedicalServiceError(Exception):
#     pass


# def fetch_doctor_availability_and_fee(doctor_id):
#     """
#     Synchronous call to user_service.
#     Required for booking decision.
#     """
#     try:
#         headers = {
#             "X-INTERNAL-TOKEN": getattr(settings, "INTERNAL_SERVICE_TOKEN", "dev-internal")
#         }
#         response = requests.get(
#             f"{settings.USER_SERVICE_BASE_URL}/internal/doctors/{doctor_id}/availability/",
#             headers=headers,
#             timeout=3
#         )
#     except requests.RequestException:
#         raise UserServiceError("User service unavailable")

#     if response.status_code != 200:
#         raise UserServiceError(f"Failed to fetch doctor data (Status: {response.status_code}, Body: {response.text})")

#     data = response.json()

#     if not data.get("approved"):
#         raise UserServiceError("Doctor is not approved")

#     if not data.get("available"):
#         raise UserServiceError("Doctor is not available")

#     return data


# def fetch_user_severity_level(user_id, auth_header):
#     """
#     Fetch user's latest severity level from medical_service.
#     Used for priority-based appointment scheduling.
#     """
#     try:
#         headers = {
#             "Authorization": auth_header,
#             "Content-Type": "application/json"
#         }
#         response = requests.get(
#             f"{settings.MEDICAL_SERVICE_BASE_URL}/questionnaire/latest",
#             headers=headers,
#             timeout=3
#         )
#     except requests.RequestException as e:
#         raise MedicalServiceError(f"Medical service unavailable: {str(e)}")

#     if response.status_code != 200:
#         raise MedicalServiceError(f"Failed to fetch severity data: {response.status_code}")

#     data = response.json()
#     return {
#         "raw_score": data.get("score"),
#         "severity_level": data.get("severity_level"),
#         "timestamp": data.get("timestamp")
#     }


# def get_available_slots_for_date(doctor_id, date):
#     """
#     Get available time slots for a specific doctor on a specific date.
#     Excludes already booked slots (pending and confirmed appointments).
#     """
#     from .models import Appointment
#     from django.db.models import Q
#     import datetime
    
#     # Get all appointments for the doctor on the given date that are pending or confirmed
#     booked_slots = Appointment.objects.filter(
#         doctor_id=doctor_id,
#         scheduled_at__date=date,
#         status__in=["pending", "confirmed"]
#     ).values_list('scheduled_at__time', flat=True)
    
#     # Get doctor's availability for that day
#     try:
#         doctor_data = fetch_doctor_availability_and_fee(doctor_id)
#         start_time = doctor_data.get("start_time")
#         end_time = doctor_data.get("end_time")
#         slot_duration = doctor_data.get("slot_duration", 30)  # in minutes
#     except UserServiceError:
#         # If we can't get doctor availability, return empty list
#         return []
    
#     # Parse start and end times
#     try:
#         start_parts = start_time.split(':')
#         start_hour = int(start_parts[0])
#         start_minute = int(start_parts[1])
        
#         end_parts = end_time.split(':')
#         end_hour = int(end_parts[0])
#         end_minute = int(end_parts[1])
#     except (ValueError, IndexError):
#         return []
    
#     # Generate all possible slots in 30-minute intervals
#     available_slots = []
#     current_time = datetime.time(start_hour, start_minute)
    
#     while True:
#         # Convert current_time to string format for comparison
#         current_time_str = current_time.strftime('%H:%M:%S')
        
#         # Check if this time slot is already booked
#         if current_time_str not in booked_slots:
#             available_slots.append(current_time.strftime('%H:%M'))
        
#         # Increment by slot duration
#         total_minutes = current_time.hour * 60 + current_time.minute + slot_duration
#         if total_minutes >= 24 * 60:  # More than 24 hours
#             break
        
#         new_hour = total_minutes // 60
#         new_minute = total_minutes % 60
        
#         if new_hour > end_hour or (new_hour == end_hour and new_minute > end_minute):
#             break
            
#         current_time = datetime.time(new_hour, new_minute)
    
#     return available_slots



"""
appointments/utils.py - RESTRUCTURED UTILITY FUNCTIONS

All business logic, external API calls, and helper functions.
Clean separation from views.
"""
import uuid
import requests
import secrets
import string
import datetime
import logging
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from django.db import transaction
from django.db.models import Q, Prefetch, Count
from django.utils import timezone

from .models import Appointment, Payment, VideoSession

logger = logging.getLogger(__name__)


# ==================== EXCEPTIONS ====================

class UserServiceError(Exception):
    """Exception for user service integration errors."""
    pass


class MedicalServiceError(Exception):
    """Exception for medical service integration errors."""
    pass


class AppointmentBusinessError(Exception):
    """Exception for appointment business logic errors."""
    pass


# ==================== VALIDATION HELPERS ====================

def is_valid_status_transition(old_status: str, new_status: str) -> bool:
    """
    Validates appointment status transitions.
    
    Args:
        old_status: Current appointment status
        new_status: Desired new status
        
    Returns:
        bool: True if transition is allowed
    """
    allowed_transitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
    }
    return new_status in allowed_transitions.get(old_status, [])


def validate_appointment_access(appointment: Appointment, user_id: str, role: str) -> bool:
    """
    Validates if user has access to appointment.
    
    Args:
        appointment: Appointment instance
        user_id: User ID from JWT
        role: User role (user/doctor/admin)
        
    Returns:
        bool: True if user has access
        
    Raises:
        AppointmentBusinessError: If access is denied
    """
    user_uuid = convert_to_uuid(user_id)
    
    if role == "admin":
        return True
    elif role == "user" and appointment.user_id == user_uuid:
        return True
    elif role == "doctor" and appointment.doctor_id == user_uuid:
        return True
    
    raise AppointmentBusinessError("Access denied to this appointment")


def validate_video_session_timing(appointment: Appointment) -> Tuple[bool, str]:
    """
    Validates if current time is within video session window.
    
    Args:
        appointment: Appointment instance
        
    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    now = timezone.now()
    appointment_time = appointment.scheduled_at
    
    # Allow access from 30 minutes before to 4 hours after appointment time
    # This provides more flexibility for users to join the video call
    # If doctor has already approved/started the session, bypass time checks
    if hasattr(appointment, 'video_session') and appointment.video_session.doctor_approved:
        return True, ""

    # Strict time window for initial access
    time_window_start = appointment_time - timezone.timedelta(minutes=30)
    time_window_end = appointment_time + timezone.timedelta(hours=4)
    
    if now < time_window_start or now > time_window_end:
        error_msg = (
            f"Video call is only available from "
            f"{time_window_start.strftime('%Y-%m-%d %H:%M')} to "
            f"{time_window_end.strftime('%Y-%m-%d %H:%M')}"
        )
        return False, error_msg
        
    return True, ""


# ==================== UUID CONVERSION ====================

def convert_to_uuid(value) -> uuid.UUID:
    """
    Converts various ID formats to UUID.
    
    Args:
        value: ID in various formats (int, str, UUID)
        
    Returns:
        uuid.UUID: Converted UUID
    """
    if isinstance(value, uuid.UUID):
        return value
    
    if isinstance(value, int):
        return uuid.UUID(int=value)
    
    value_str = str(value)
    
    # Handle legacy integer IDs
    if len(value_str) < 32 and value_str.isdigit():
        return uuid.UUID(int=int(value_str))
    
    # Handle UUID strings
    return uuid.UUID(value_str)


# ==================== EXTERNAL SERVICE INTEGRATION ====================

def fetch_doctor_availability_and_fee(doctor_id: uuid.UUID) -> Dict:
    """
    Synchronous call to user_service for doctor data.
    
    Args:
        doctor_id: Doctor's UUID
        
    Returns:
        dict: Doctor availability and fee data
        
    Raises:
        UserServiceError: If service call fails or doctor not available
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
    except requests.RequestException as e:
        logger.error(f"User service request failed: {e}")
        raise UserServiceError("User service unavailable")

    if response.status_code != 200:
        logger.error(f"Doctor availability fetch failed: {response.status_code}, {response.text}")
        raise UserServiceError(
            f"Failed to fetch doctor data (Status: {response.status_code})"
        )

    data = response.json()

    if not data.get("approved"):
        raise UserServiceError("Doctor is not approved")

    if not data.get("available"):
        raise UserServiceError("Doctor is not available")

    return data


def fetch_user_severity_level(user_id: str, auth_header: str) -> Optional[Dict]:
    """
    Fetch user's latest severity level from medical_service.
    Non-blocking - returns None if service unavailable.
    
    Args:
        user_id: User's ID
        auth_header: Authorization header
        
    Returns:
        dict or None: Severity data or None if unavailable
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
        
        if response.status_code == 200:
            data = response.json()
            return {
                "raw_score": data.get("score"),
                "severity_level": data.get("severity_level"),
                "timestamp": data.get("timestamp")
            }
    except requests.RequestException as e:
        logger.warning(f"Medical service unavailable: {e}")
    
    return None


def fetch_medical_summary(user_id: str, auth_header: str) -> Dict:
    """
    Fetches patient's medical summary from medical_service.
    
    Args:
        user_id: User's ID
        auth_header: Authorization header
        
    Returns:
        dict: Medical summary data or empty dict
    """
    try:
        headers = {"Authorization": auth_header} if auth_header else {}
        response = requests.get(
            f"{settings.MEDICAL_SERVICE_BASE_URL}/summary/user/{user_id}",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        logger.error(f"Failed to fetch medical summary: {e}")
    
    return {}


# ==================== APPOINTMENT BUSINESS LOGIC ====================

@transaction.atomic
def create_appointment_with_validation(
    user_id: str,
    doctor_id: uuid.UUID,
    scheduled_at: datetime.datetime,
    severity_level: Optional[int],
    notes: str,
    auth_header: str
) -> Tuple[Appointment, str, Optional[str], Decimal]:
    """
    Creates appointment with full validation and external service integration.
    
    Args:
        user_id: User's ID from JWT
        doctor_id: Doctor's UUID
        scheduled_at: Appointment datetime
        severity_level: Optional severity level
        notes: Appointment notes
        auth_header: Authorization header for external services
        
    Returns:
        Tuple[Appointment, str, str, Decimal]: 
            (appointment, priority, severity_level_str, consultation_fee)
        
    Raises:
        AppointmentBusinessError: If validation fails
    """
    user_uuid = convert_to_uuid(user_id)
    
    # Fetch user's latest severity (non-blocking)
    severity_data = fetch_user_severity_level(user_id, auth_header)
    
    # Validate doctor availability and fetch fee
    try:
        doctor_data = fetch_doctor_availability_and_fee(doctor_id)
        consultation_fee = Decimal(str(doctor_data.get("consultation_fee")))
    except UserServiceError as e:
        raise AppointmentBusinessError(str(e))
    
    # Check for conflicting appointments using advanced ORM
    conflicting_count = Appointment.objects.filter(
        doctor_id=doctor_id,
        scheduled_at=scheduled_at,
        status__in=["pending", "confirmed"]
    ).count()
    
    if conflicting_count > 0:
        raise AppointmentBusinessError(
            "This time slot is already booked. Please select another time."
        )
    
    # Determine priority based on severity
    priority = "normal"
    severity_level_str = None
    final_severity_score = severity_level
    
    if severity_data:
        severity_level_str = severity_data.get("severity_level")
        final_severity_score = final_severity_score or severity_data.get("raw_score")
        
        if severity_level_str in ["severe", "moderately_severe"]:
            priority = "high"
        elif severity_level_str == "moderate":
            priority = "medium"
    
    # Create appointment
    appointment = Appointment.objects.create(
        user_id=user_uuid,
        doctor_id=doctor_id,
        scheduled_at=scheduled_at,
        severity_level=final_severity_score,
        status="pending",
        notes=notes
    )
    
    return appointment, priority, severity_level_str, consultation_fee


def get_filtered_appointments(user_id: str, role: str) -> List[Appointment]:
    """
    Get filtered appointments based on user role with optimized queries.
    
    Args:
        user_id: User's ID from JWT
        role: User role (user/doctor/admin)
        
    Returns:
        QuerySet: Filtered appointments
    """
    user_uuid = convert_to_uuid(user_id)
    
    # Base queryset with prefetch for related objects
    base_qs = Appointment.objects.select_related('payment').prefetch_related(
        Prefetch('video_session', queryset=VideoSession.objects.all())
    )
    
    # Filter based on role
    if role == "user":
        qs = base_qs.filter(user_id=user_uuid)
    elif role == "doctor":
        qs = base_qs.filter(doctor_id=user_uuid)
    elif role == "admin":
        qs = base_qs.all()
    else:
        raise AppointmentBusinessError("Invalid role")
    
    return qs.order_by("-scheduled_at")


@transaction.atomic
def cancel_appointment(appointment: Appointment, user_id: str) -> Appointment:
    """
    Cancels an appointment with validation.
    
    Args:
        appointment: Appointment instance
        user_id: User's ID from JWT
        
    Returns:
        Appointment: Updated appointment
        
    Raises:
        AppointmentBusinessError: If cancellation not allowed
    """
    user_uuid = convert_to_uuid(user_id)
    
    # Verify ownership
    if appointment.user_id != user_uuid:
        raise AppointmentBusinessError("Only appointment owner can cancel")
    
    # Validate state transition
    if not is_valid_status_transition(appointment.status, "cancelled"):
        raise AppointmentBusinessError(
            f"Cannot cancel appointment with status '{appointment.status}'"
        )
    
    # Update status
    appointment.status = "cancelled"
    appointment.save(update_fields=["status", "updated_at"])
    
    return appointment


@transaction.atomic
def complete_appointment(appointment: Appointment, user_id: str) -> Appointment:
    """
    Marks appointment as completed (Doctor only).
    
    Args:
        appointment: Appointment instance
        user_id: Doctor's ID from JWT
        
    Returns:
        Appointment: Updated appointment
        
    Raises:
        AppointmentBusinessError: If completion not allowed
    """
    user_uuid = convert_to_uuid(user_id)
    
    # Verify doctor ownership
    if appointment.doctor_id != user_uuid:
        raise AppointmentBusinessError("Only assigned doctor can complete appointment")
    
    # Validate state transition
    if not is_valid_status_transition(appointment.status, "completed"):
        raise AppointmentBusinessError(
            f"Cannot complete appointment with status '{appointment.status}'"
        )
    
    # Update status
    appointment.status = "completed"
    appointment.save(update_fields=["status", "updated_at"])
    
    return appointment


def get_available_slots_for_date(doctor_id: uuid.UUID, date: datetime.date) -> List[str]:
    """
    Get available time slots for a specific doctor on a specific date.
    Uses advanced ORM queries for efficiency.
    
    Args:
        doctor_id: Doctor's UUID
        date: Date to check availability
        
    Returns:
        list: Available time slots in HH:MM format
    """
    # Get booked slots using values_list for efficiency
    booked_times = Appointment.objects.filter(
        doctor_id=doctor_id,
        scheduled_at__date=date,
        status__in=["pending", "confirmed"]
    ).values_list('scheduled_at__time', flat=True)
    
    booked_slots = set(t.strftime('%H:%M:%S') for t in booked_times)
    
    # Get doctor's availability
    try:
        doctor_data = fetch_doctor_availability_and_fee(doctor_id)
        start_time = doctor_data.get("start_time", "09:00")
        end_time = doctor_data.get("end_time", "17:00")
        slot_duration = doctor_data.get("slot_duration", 30)
    except UserServiceError:
        return []
    
    # Parse times
    try:
        start_parts = start_time.split(':')
        start_hour, start_minute = int(start_parts[0]), int(start_parts[1])
        
        end_parts = end_time.split(':')
        end_hour, end_minute = int(end_parts[0]), int(end_parts[1])
    except (ValueError, IndexError):
        logger.error("Invalid time format in doctor availability")
        return []
    
    # Generate available slots
    available_slots = []
    current_time = datetime.time(start_hour, start_minute)
    
    while True:
        current_time_str = current_time.strftime('%H:%M:%S')
        
        # Check if slot is not booked
        if current_time_str not in booked_slots:
            available_slots.append(current_time.strftime('%H:%M'))
        
        # Increment by slot duration
        total_minutes = current_time.hour * 60 + current_time.minute + slot_duration
        
        if total_minutes >= 24 * 60:
            break
        
        new_hour = total_minutes // 60
        new_minute = total_minutes % 60
        
        if new_hour > end_hour or (new_hour == end_hour and new_minute > end_minute):
            break
        
        current_time = datetime.time(new_hour, new_minute)
    
    return available_slots


# ==================== PAYMENT BUSINESS LOGIC ====================

@transaction.atomic
def create_payment_order(
    appointment: Appointment,
    user_id: str
) -> Tuple[str, Decimal, str]:
    """
    Creates Razorpay payment order for appointment.
    
    Args:
        appointment: Appointment instance
        user_id: User's ID from JWT
        
    Returns:
        Tuple[str, Decimal, str]: (razorpay_order_id, amount, currency)
        
    Raises:
        AppointmentBusinessError: If payment creation fails
    """
    user_uuid = convert_to_uuid(user_id)
    
    # Verify ownership
    if appointment.user_id != user_uuid:
        raise AppointmentBusinessError("Appointment does not belong to user")
    
    # Verify status
    if appointment.status != "pending":
        raise AppointmentBusinessError(
            "Payment can only be created for pending appointments"
        )
    
    # Check existing payment
    if hasattr(appointment, "payment"):
        existing_payment = appointment.payment
        if existing_payment.status == "paid":
            raise AppointmentBusinessError("Payment already completed")
        return (
            existing_payment.razorpay_order_id,
            existing_payment.amount,
            existing_payment.currency
        )
    
    # Fetch consultation fee
    try:
        doctor_data = fetch_doctor_availability_and_fee(appointment.doctor_id)
        consultation_fee = Decimal(str(doctor_data.get("consultation_fee")))
    except UserServiceError as e:
        raise AppointmentBusinessError(f"Failed to fetch consultation fee: {str(e)}")
    
    # Create Razorpay order
    from .razorpay_utils import create_razorpay_order
    amount_paise = int(consultation_fee * 100)
    
    try:
        razorpay_order = create_razorpay_order(
            amount_paise=amount_paise,
            currency="INR",
            notes={
                "appointment_id": str(appointment.id),
                "user_id": str(appointment.user_id),
                "doctor_id": str(appointment.doctor_id),
            }
        )
        razorpay_order_id = razorpay_order["id"]
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        
        # Fallback for development
        import os
        if os.getenv('DJANGO_DEBUG', 'True') == 'True':
            razorpay_order_id = f"order_mock_{str(uuid.uuid4()).replace('-', '')[:10]}"
            logger.info(f"Created mock Razorpay order ID: {razorpay_order_id}")
        else:
            raise AppointmentBusinessError("Failed to create payment order")
    
    # Create payment record
    payment = Payment.objects.create(
        appointment=appointment,
        amount=consultation_fee,
        currency="INR",
        razorpay_order_id=razorpay_order_id,
        status="created"
    )
    
    # Immediately confirm appointment
    appointment.status = "confirmed"
    appointment.save(update_fields=["status"])
    
    return razorpay_order_id, consultation_fee, "INR"


@transaction.atomic
def process_payment_webhook(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> Tuple[Payment, Appointment]:
    """
    Processes Razorpay payment webhook.
    
    Args:
        razorpay_order_id: Razorpay order ID
        razorpay_payment_id: Razorpay payment ID
        razorpay_signature: Webhook signature
        
    Returns:
        Tuple[Payment, Appointment]: Updated payment and appointment
        
    Raises:
        AppointmentBusinessError: If processing fails
    """
    from .razorpay_utils import verify_razorpay_signature
    
    # Verify signature
    if not verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        raise AppointmentBusinessError("Invalid signature")
    
    # Find payment
    try:
        payment = Payment.objects.select_for_update().get(
            razorpay_order_id=razorpay_order_id
        )
    except Payment.DoesNotExist:
        raise AppointmentBusinessError("Payment not found")
    
    # Idempotency check
    if payment.status == "paid":
        logger.info(f"Payment already processed: {razorpay_order_id}")
        return payment, payment.appointment
    
    # Update payment
    payment.status = "paid"
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.save(update_fields=["status", "razorpay_payment_id", "razorpay_signature"])
    
    # Update appointment
    appointment = payment.appointment
    if appointment.status == "pending":
        appointment.status = "confirmed"
        appointment.save(update_fields=["status"])
    
    return payment, appointment


# ==================== VIDEO SESSION BUSINESS LOGIC ====================

def generate_video_session_tokens(appointment: Appointment) -> Dict[str, str]:
    """
    Generates video session tokens for user and doctor.
    
    Args:
        appointment: Appointment instance
        
    Returns:
        dict: Session tokens and room name
    """
    session_id = f"session_{appointment.id}"
    user_token = f"user_token_{appointment.user_id}"
    doctor_token = f"doctor_token_{appointment.doctor_id}"
    
    # Generate unique room name
    room_name = ''.join(
        secrets.choice(string.ascii_letters + string.digits) for _ in range(12)
    )
    
    return {
        'session_id': session_id,
        'user_token': user_token,
        'doctor_token': doctor_token,
        'room_name': room_name
    }


@transaction.atomic
def create_video_session(
    appointment: Appointment,
    provider: str,
    user_id: str,
    role: str
) -> Tuple[VideoSession, str]:
    """
    Creates video session for confirmed appointment.
    
    Args:
        appointment: Appointment instance
        provider: Video provider (twilio/agora)
        user_id: User's ID from JWT
        role: User role
        
    Returns:
        Tuple[VideoSession, str]: (video_session, token_for_user)
        
    Raises:
        AppointmentBusinessError: If creation fails
    """
    # Validate access
    validate_appointment_access(appointment, user_id, role)
    
    # Check appointment status
    if appointment.status != "confirmed":
        raise AppointmentBusinessError(
            "Video session can only be created for confirmed appointments"
        )
    
    # Check if session exists
    if hasattr(appointment, 'video_session'):
        video_session = appointment.video_session
        token = video_session.user_token if role == "user" else video_session.doctor_token
        return video_session, token
    
    # Generate tokens
    tokens = generate_video_session_tokens(appointment)
    
    # Create session
    video_session = VideoSession.objects.create(
        appointment=appointment,
        provider=provider,
        session_id=tokens['session_id'],
        token=tokens['user_token'] if role == "user" else tokens['doctor_token'],
        user_token=tokens['user_token'],
        doctor_token=tokens['doctor_token'],
        doctor_approved=(role == 'doctor'),  # Auto-approve if created by doctor
        room_name=tokens['room_name']
    )
    
    token = tokens['user_token'] if role == "user" else tokens['doctor_token']
    return video_session, token


@transaction.atomic
def update_video_session(
    video_session: VideoSession,
    approve: Optional[bool] = None,
    ended: bool = False
) -> VideoSession:
    """
    Updates video session status.
    
    Args:
        video_session: VideoSession instance
        approve: Whether to approve session (doctor only)
        ended: Whether to mark session as ended
        
    Returns:
        VideoSession: Updated video session
    """
    update_fields = []
    
    if approve is not None:
        video_session.doctor_approved = approve
        update_fields.append('doctor_approved')
    
    if ended and not video_session.ended_at:
        video_session.ended_at = timezone.now()
        update_fields.append('ended_at')
    
    if update_fields:
        video_session.save(update_fields=update_fields)
    
    return video_session