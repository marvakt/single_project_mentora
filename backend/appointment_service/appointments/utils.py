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


def fetch_doctor_availability_and_fee(doctor_id):
    """
    Synchronous call to user_service.
    Required for booking decision.
    """
    try:
        response = requests.get(
            f"{settings.USER_SERVICE_BASE_URL}/internal/doctors/{doctor_id}/availability/",
            timeout=3
        )
    except requests.RequestException:
        raise UserServiceError("User service unavailable")

    if response.status_code != 200:
        raise UserServiceError("Failed to fetch doctor data")

    data = response.json()

    if not data.get("approved"):
        raise UserServiceError("Doctor is not approved")

    if not data.get("available"):
        raise UserServiceError("Doctor is not available")

    return data.get("consultation_fee")
