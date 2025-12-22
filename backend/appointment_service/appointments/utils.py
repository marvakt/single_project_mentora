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
        raise UserServiceError(f"Failed to fetch doctor data (Status: {response.status_code})")

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