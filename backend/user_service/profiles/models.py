# profiles/models.py
from django.db import models


# ============================================================
# USER PROFILE MODEL
# ============================================================
class UserProfile(models.Model):
    """
    This stores all user-related profile data.
    auth_service stores only authentication.
    """

    user_id = models.BigIntegerField(unique=True, help_text="PK from auth_service")
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, default="user")  # user | doctor | admin

    # Profile info
    name = models.CharField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    # Status flags
    status = models.CharField(
        max_length=20,
        choices=[
            ("active", "Active"),
            ("suspended", "Suspended"),
            ("pending", "Pending"),
            ("deactivated", "Deactivated"),
        ],
        default="active"
    )

    onboarding_status = models.IntegerField(default=0)

    # Activity tracking
    last_activity = models.DateTimeField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user_id} - {self.email}"


# ============================================================
# DOCTOR PROFILE
# ============================================================
class DoctorProfile(models.Model):
    """
    Extra fields only doctors have.
    A doctor is always tied to a UserProfile with role='doctor'.
    """

    profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name="doctor")

    specialization = models.CharField(max_length=150, blank=True, null=True)
    experience_years = models.IntegerField(default=0)
    consultation_fee = models.IntegerField(default=500)
    bio = models.TextField(blank=True, null=True)

    doctor_status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("approved", "Approved"),
            ("rejected", "Rejected"),
            ("suspended", "Suspended"),
        ],
        default="pending"
    )

    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Doctor: {self.profile.email} ({self.doctor_status})"


# ============================================================
# DOCTOR DOCUMENTS
# ============================================================
class DoctorDocument(models.Model):
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="documents")

    doc_type = models.CharField(max_length=50)  # license, degree, id_proof
    file_url = models.TextField()
    verified = models.BooleanField(default=False)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.profile.email} - {self.doc_type}"


# ============================================================
# DOCTOR AVAILABILITY
# ============================================================
class DoctorAvailability(models.Model):
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="availability")

    day_of_week = models.IntegerField()  # 0=Monday .. 6=Sunday
    start_time = models.TimeField()
    end_time = models.TimeField()
    timezone = models.CharField(max_length=50, default="UTC")

    class Meta:
        unique_together = (("profile", "day_of_week", "start_time", "end_time"),)

    def __str__(self):
        return f"{self.profile.email} — {self.day_of_week} {self.start_time}-{self.end_time}"


# ============================================================
# NOTIFICATION SYSTEM
# ============================================================
class Notification(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="notifications")

    title = models.CharField(max_length=200)
    message = models.TextField()

    sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification to {self.user_profile.email} — {self.title}"
