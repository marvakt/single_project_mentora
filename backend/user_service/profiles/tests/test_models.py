from django.test import TestCase
from profiles.models import (
    DoctorAvailability,
    DoctorProfile,
    MoodEntry,
    UserProfile,
)

class ProfileModelTests(TestCase):
    def test_user_profile_creation(self):
        """Test user profile creation"""
        profile = UserProfile.objects.create(
            user_id=8008,
            email="modeltest@example.com",
            role="user",
            name="Model Test User"
        )
        
        self.assertEqual(profile.email, "modeltest@example.com")
        self.assertEqual(profile.role, "user")
        self.assertEqual(profile.name, "Model Test User")
        self.assertEqual(profile.status, "active")

    def test_doctor_profile_creation(self):
        """Test doctor profile creation"""
        user_profile = UserProfile.objects.create(
            user_id=9009,
            email="docmodel@example.com",
            role="doctor",
            name="Dr. Model"
        )
        
        doctor_profile = DoctorProfile.objects.create(
            profile=user_profile,
            specialization="Psychiatrist",
            experience_years=10,
            consultation_fee=1200
        )
        
        self.assertEqual(doctor_profile.specialization, "Psychiatrist")
        self.assertEqual(doctor_profile.experience_years, 10)
        self.assertEqual(doctor_profile.consultation_fee, 1200)
        self.assertEqual(doctor_profile.profile, user_profile)

    def test_mood_entry_creation(self):
        """Test mood entry creation"""
        user_profile = UserProfile.objects.create(
            user_id=10010,
            email="moodmodel@example.com",
            role="user"
        )
        
        mood_entry = MoodEntry.objects.create(
            user_profile=user_profile,
            mood_score=7,
            anxiety_level=4,
            energy_level=6,
            sleep_hours=7.0,
            notes="Test mood entry"
        )
        
        self.assertEqual(mood_entry.mood_score, 7)
        self.assertEqual(mood_entry.anxiety_level, 4)
        self.assertEqual(mood_entry.user_profile, user_profile)
        self.assertIsNotNone(mood_entry.created_at)

    def test_doctor_availability_creation(self):
        """Test doctor availability creation"""
        user_profile = UserProfile.objects.create(
            user_id=11011,
            email="availability@example.com",
            role="doctor"
        )
        
        doctor_profile = DoctorProfile.objects.create(
            profile=user_profile,
            specialization="Psychologist",
            experience_years=5,
            consultation_fee=800
        )
        
        availability = DoctorAvailability.objects.create(
            profile=user_profile, # Changed from doctor_profile to user_profile
            day_of_week=1,  # Tuesday
            start_time="09:00",
            end_time="17:00"
        )
        
        self.assertEqual(availability.day_of_week, 1)
        self.assertEqual(availability.start_time, "09:00")
        self.assertEqual(availability.end_time, "17:00")
        self.assertEqual(availability.profile, user_profile)
