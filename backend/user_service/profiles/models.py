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
    
    # Mood tracking preferences
    receive_mood_notifications = models.BooleanField(default=True, help_text="Whether user wants to receive daily mood notifications")

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

    @property
    def average_rating(self):
        """Calculate and return the average rating for this doctor."""
        ratings = self.profile.ratings_received.all()
        if not ratings:
            return 0.0
        return sum(r.rating for r in ratings) / len(ratings)

    @property
    def total_ratings(self):
        """Return the total number of ratings for this doctor."""
        return self.profile.ratings_received.count()


# ============================================================
# DOCTOR DOCUMENTS
# ============================================================
class DoctorDocument(models.Model):
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="documents")

    doc_type = models.CharField(max_length=50)  # license, degree, id_proof
    file_url = models.TextField()
    file_key = models.TextField(blank=True, null=True, help_text="S3 object key for the uploaded file")
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
# DOCTOR RATINGS AND REVIEWS
# ============================================================
class DoctorRating(models.Model):
    """
    Store ratings given by users to doctors.
    Each user can rate a doctor only once.
    """
    doctor = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="ratings_received")
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="ratings_given")
    
    # Rating value (1-5 stars)
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    
    # Optional review text
    review = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('doctor', 'user')  # One rating per user per doctor
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} → {self.doctor.email}: {self.rating}/5"


# ============================================================
# DOCTOR SPECIALIZATION CATEGORIES
# ============================================================
class DoctorSpecializationCategory(models.Model):
    """
    Categories for doctor specializations to help with matching.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name


# ============================================================
# MOOD TRACKING
# ============================================================
class MoodEntry(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="mood_entries")
    
    mood_score = models.IntegerField(help_text="Mood score from 1-10")  # 1-10 scale
    anxiety_level = models.IntegerField(help_text="Anxiety level from 1-10")  # 1-10 scale
    energy_level = models.IntegerField(help_text="Energy level from 1-10")  # 1-10 scale
    sleep_hours = models.FloatField(help_text="Hours of sleep")
    notes = models.TextField(blank=True, null=True, help_text="Additional notes about mood")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Mood for {self.user_profile.email} on {self.created_at}"

    class Meta:
        ordering = ['-created_at']


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
