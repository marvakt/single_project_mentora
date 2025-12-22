import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "user_service_project.settings")
django.setup()

from profiles.models import UserProfile, DoctorProfile, DoctorAvailability

def fix_all_doctors():
    print("Checking Doctor Profiles...")
    doctors = DoctorProfile.objects.all()
    
    if not doctors.exists():
        print("No doctors found!")
        return

    for doc in doctors:
        user = doc.profile
        print(f"\nProcessing UserID: {user.user_id} ({user.email})")
        
        # 1. Ensure User is Active and Onboarded
        if user.onboarding_status != 100:
            print(f"  - Fixing onboarding_status (was {user.onboarding_status})")
            user.onboarding_status = 100
            user.save()
        else:
            print("  - Onboarding Complete: OK")

        # 2. Ensure Doctor is Approved
        if doc.doctor_status != "approved":
            print(f"  - Fixing doctor_status (was {doc.doctor_status})")
            doc.doctor_status = "approved"
            doc.save()
        else:
            print("  - Doctor Approved: OK")
            
        # 3. Ensure Availability Exists
        has_availability = user.availability.exists()
        if not has_availability:
            print("  - No availability found. Adding default M-F 9-5 slots.")
            # Add Monday (0) to Friday (4)
            for day in range(5):
                DoctorAvailability.objects.create(
                    profile=user,
                    day_of_week=day,
                    start_time="09:00:00",
                    end_time="17:00:00"
                )
            print("  - Availability Added: OK")
        else:
            print("  - Availablity Exists: OK")

if __name__ == "__main__":
    fix_all_doctors()
