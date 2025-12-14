# profiles/services.py
from .models import DoctorProfile, DoctorDocument, DoctorAvailability


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
