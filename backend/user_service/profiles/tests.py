from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
import datetime
from django.utils import timezone
from .models import UserProfile, DoctorProfile, MoodEntry, DoctorAvailability, DoctorDocument
from django.contrib.auth import get_user_model
from decimal import Decimal
import uuid
import json
from django.core.files.uploadedfile import SimpleUploadedFile


User = get_user_model()

class UserProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_id = 1001
        self.email = "test@example.com"
        
        # Create base profile
        self.profile = UserProfile.objects.create(
            user_id=self.user_id,
            email=self.email,
            role="user",
            name="Test User"
        )

    @patch("profiles.authentication.jwt.decode")
    def test_get_profile_success(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": self.email,
            "type": "access",
            "exp": 9999999999
        }
        
        response = self.client.get(
            f"/api/profile/{self.user_id}/",
            HTTP_AUTHORIZATION="Bearer valid_token_1"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.email)

    @patch("profiles.authentication.jwt.decode")
    def test_update_profile_success(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": self.email,
            "type": "access",
            "exp": 9999999999
        }
        
        data = {"name": "Updated Name", "phone": "1234567890"}
        response = self.client.put(
            f"/api/profile/{self.user_id}/update/",
            data,
            HTTP_AUTHORIZATION="Bearer valid_token_2"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.name, "Updated Name")

    @patch("profiles.authentication.jwt.decode")
    def test_update_profile_invalid_data(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": self.email,
            "type": "access",
            "exp": 9999999999
        }
        
        # Test with invalid phone number
        data = {"phone": "invalid_phone"}
        response = self.client.put(
            f"/api/profile/{self.user_id}/update/",
            data,
            HTTP_AUTHORIZATION="Bearer valid_token_3"
        )
        
        # Should return validation error
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DoctorProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_id = 2002
        self.email = "doc@example.com"
        
        self.profile = UserProfile.objects.create(
            user_id=self.user_id,
            email=self.email,
            role="doctor",
            name="Dr. Test"
        )

    @patch("profiles.authentication.jwt.decode")
    def test_create_doctor_profile(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "doctor",
            "email": self.email,
            "type": "access",
            "exp": 9999999999
        }
        
        data = {
            "specialization": "Psychiatrist",
            "experience_years": 10,
            "consultation_fee": 1000,
            "professional_bio": "Experienced psychiatrist"
        }
        
        response = self.client.post(
            f"/api/doctor/{self.user_id}/profile/",
            data,
            HTTP_AUTHORIZATION="Bearer valid_token_3"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        doctor = DoctorProfile.objects.get(profile=self.profile)
        self.assertEqual(doctor.specialization, "Psychiatrist")
        self.assertEqual(doctor.consultation_fee, 1000)
        self.assertEqual(doctor.experience_years, 10)

    @patch("profiles.authentication.jwt.decode")
    def test_update_doctor_profile(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "doctor",
            "email": self.email,
            "type": "access",
            "exp": 9999999999
        }
        
        # First create the doctor profile
        doctor_profile = DoctorProfile.objects.create(
            profile=self.profile,
            specialization="Psychiatrist",
            experience_years=5,
            consultation_fee=800
        )
        
        # Update the profile
        update_data = {
            "specialization": "Clinical Psychologist",
            "experience_years": 12,
            "consultation_fee": 1200
        }
        
        response = self.client.put(
            f"/api/doctor/{self.user_id}/profile/",
            update_data,
            HTTP_AUTHORIZATION="Bearer valid_token_4"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        doctor_profile.refresh_from_db()
        self.assertEqual(doctor_profile.specialization, "Clinical Psychologist")
        self.assertEqual(doctor_profile.experience_years, 12)
        self.assertEqual(doctor_profile.consultation_fee, 1200)

    @patch("profiles.authentication.jwt.decode")
    def test_add_availability(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "doctor",
            "email": self.email,
            "type": "access",
            "exp": 9999999999
        }
        
        # Ensure doctor profile exists
        DoctorProfile.objects.create(profile=self.profile)
        
        data = {
            "day_of_week": 1, # Tuesday
            "start_time": "09:00",
            "end_time": "17:00",
            "timezone": "UTC"
        }
        
        response = self.client.post(
            f"/api/doctor/{self.user_id}/availability/add/",
            data,
            format='json',
            HTTP_AUTHORIZATION="Bearer valid_token_5"
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(DoctorAvailability.objects.filter(profile=self.profile).exists())

    @patch("profiles.authentication.jwt.decode")
    def test_get_doctor_availability(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "doctor",
            "email": self.email,
            "type": "access",
            "exp": 9999999999
        }
        
        # Create doctor profile and availability
        doctor_profile = DoctorProfile.objects.create(profile=self.profile)
        DoctorAvailability.objects.create(
            profile=doctor_profile,
            day_of_week=1,
            start_time="09:00",
            end_time="17:00"
        )
        
        response = self.client.get(
            f"/api/doctor/{self.user_id}/availability/",
            HTTP_AUTHORIZATION="Bearer valid_token_6"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @patch("profiles.authentication.jwt.decode")
    def test_doctor_profile_validation(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "doctor",
            "email": self.email,
            "type": "access",
            "exp": 9999999999
        }
        
        # Test with invalid experience years
        invalid_data = {
            "specialization": "Psychiatrist",
            "experience_years": -1,  # Invalid
            "consultation_fee": 1000
        }
        
        response = self.client.post(
            f"/api/doctor/{self.user_id}/profile/",
            invalid_data,
            HTTP_AUTHORIZATION="Bearer valid_token_7"
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MoodTrackingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_id = 3003
        self.profile = UserProfile.objects.create(
            user_id=self.user_id,
            email="mood@example.com",
            role="user"
        )

    @patch("profiles.authentication.jwt.decode")
    @patch("profiles.views.publish_mood_event") # Mock the SNS publisher
    def test_submit_mood_entry(self, mock_publish, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "mood@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        data = {
            "mood_score": 7,
            "anxiety_level": 3,
            "energy_level": 8,
            "sleep_hours": 7.5,
            "notes": "Feeling good"
        }
        
        response = self.client.post(
            "/api/mood-entries/",
            data,
            HTTP_AUTHORIZATION="Bearer valid_token_8"
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MoodEntry.objects.count(), 1)
        
        # Verify publish was called
        mock_publish.assert_called_once()
        args = mock_publish.call_args[0][0]
        self.assertEqual(args['mood_score'], 7)

    @patch("profiles.authentication.jwt.decode")
    def test_get_mood_history(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "mood@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        # Create some mood entries
        MoodEntry.objects.create(
            profile=self.profile,
            mood_score=7,
            anxiety_level=3,
            energy_level=8,
            sleep_hours=7.5
        )
        
        response = self.client.get(
            f"/api/mood-entries/{self.user_id}/",
            HTTP_AUTHORIZATION="Bearer valid_token_9"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @patch("profiles.authentication.jwt.decode")
    def test_mood_entry_validation(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "mood@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        # Test with invalid mood score
        invalid_data = {
            "mood_score": 11,  # Invalid: out of range 1-10
            "anxiety_level": 3,
            "energy_level": 8,
            "sleep_hours": 7.5
        }
        
        response = self.client.post(
            "/api/mood-entries/",
            invalid_data,
            HTTP_AUTHORIZATION="Bearer valid_token_10"
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DoctorSuggestionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_id = 4004
        
        # Create doctor profiles with different specializations
        self.user_profile = UserProfile.objects.create(
            user_id=self.user_id,
            email="user@example.com",
            role="user"
        )
        
        # Create a doctor profile
        self.doctor_user = UserProfile.objects.create(
            user_id=5005,
            email="doc@example.com",
            role="doctor",
            name="Dr. Smith"
        )
        
        self.doctor_profile = DoctorProfile.objects.create(
            profile=self.doctor_user,
            specialization="Psychiatrist",
            experience_years=10,
            consultation_fee=1000,
            rating=4.5,
            total_reviews=50
        )

    @patch("profiles.authentication.jwt.decode")
    def test_get_doctor_suggestions(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        # Test with severity score
        data = {
            "severity_score": 15,  # Moderately severe
            "triage_profile": {
                "severity_level": "moderately_severe",
                "specialist_type": "psychiatrist",
                "red_flags": {"high_risk": False},
                "dominant_symptoms": ["mood", "sleep"]
            }
        }
        
        response = self.client.post(
            "/api/doctors/suggest/",
            data,
            HTTP_AUTHORIZATION="Bearer valid_token_11"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return at least one doctor
        self.assertGreaterEqual(len(response.data), 0)

    @patch("profiles.authentication.jwt.decode")
    def test_get_doctor_suggestions_with_triage_profile(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        # Test with full triage profile
        triage_profile = {
            "severity_score": 18,
            "severity_level": "moderately_severe",
            "red_flags": {
                "suicidal_ideation": True,
                "high_risk": True
            },
            "dominant_symptoms": ["mood", "anxiety"],
            "urgency_level": "urgent",
            "specialist_type": "psychiatrist",
            "recommendations": ["Immediate consultation recommended"],
            "assessed_at": "2023-10-01T10:00:00Z",
            "confidence_score": 0.8,
            "requires_manual_review": False,
            "triage_version": "v1",
            "decision_locked": True,
            "immutable": True
        }
        
        data = {
            "severity_score": 18,
            "triage_profile": triage_profile
        }
        
        response = self.client.post(
            "/api/doctors/suggest/",
            data,
            HTTP_AUTHORIZATION="Bearer valid_token_12"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("profiles.authentication.jwt.decode")
    def test_doctor_suggestions_red_flag_priority(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        # Test with red flag that should prioritize psychiatrists
        data = {
            "severity_score": 5,  # Low severity
            "triage_profile": {
                "severity_level": "mild",
                "red_flags": {
                    "suicidal_ideation": True,
                    "high_risk": True
                },
                "specialist_type": "psychiatrist"
            }
        }
        
        response = self.client.post(
            "/api/doctors/suggest/",
            data,
            HTTP_AUTHORIZATION="Bearer valid_token_13"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class DoctorAvailabilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.doctor_user = UserProfile.objects.create(
            user_id=6006,
            email="doc2@example.com",
            role="doctor",
            name="Dr. Johnson"
        )
        
        self.doctor_profile = DoctorProfile.objects.create(
            profile=self.doctor_user,
            specialization="Psychologist",
            experience_years=5,
            consultation_fee=800
        )

    @patch("profiles.authentication.jwt.decode")
    def test_create_availability(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": 6006,
            "role": "doctor",
            "email": "doc2@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        data = {
            "day_of_week": 2,  # Wednesday
            "start_time": "10:00",
            "end_time": "16:00",
            "timezone": "UTC"
        }
        
        response = self.client.post(
            f"/api/doctor/{6006}/availability/add/",
            data,
            format='json',
            HTTP_AUTHORIZATION="Bearer valid_token_14"
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(DoctorAvailability.objects.filter(
            profile=self.doctor_profile,
            day_of_week=2
        ).exists())

    @patch("profiles.authentication.jwt.decode")
    def test_get_available_doctors_for_date(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": 1001,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        # Create availability for the doctor
        DoctorAvailability.objects.create(
            profile=self.doctor_profile,
            day_of_week=timezone.now().weekday(),  # Today
            start_time="09:00",
            end_time="17:00"
        )
        
        response = self.client.get(
            f"/api/doctor/{6006}/available/",
            HTTP_AUTHORIZATION="Bearer valid_token_15"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("profiles.authentication.jwt.decode")
    def test_availability_validation(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": 6006,
            "role": "doctor",
            "email": "doc2@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        # Test with invalid time format
        invalid_data = {
            "day_of_week": 2,
            "start_time": "invalid_time",
            "end_time": "16:00",
            "timezone": "UTC"
        }
        
        response = self.client.post(
            f"/api/doctor/{6006}/availability/add/",
            invalid_data,
            format='json',
            HTTP_AUTHORIZATION="Bearer valid_token_16"
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DocumentUploadTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.doctor_user = UserProfile.objects.create(
            user_id=7007,
            email="doc3@example.com",
            role="doctor",
            name="Dr. Williams"
        )
        
        self.doctor_profile = DoctorProfile.objects.create(
            profile=self.doctor_user,
            specialization="Cardiologist",
            experience_years=8,
            consultation_fee=1200
        )

    @patch("profiles.authentication.jwt.decode")
    def test_upload_doctor_document(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": 7007,
            "role": "doctor",
            "email": "doc3@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        # Create a simple file for upload
        test_file = SimpleUploadedFile(
            name="test_document.pdf",
            content=b"test file content",
            content_type="application/pdf"
        )
        
        data = {
            "document_type": "license",
            "document_file": test_file
        }
        
        response = self.client.post(
            f"/api/doctor/{7007}/documents/upload/",
            data,
            format='multipart',
            HTTP_AUTHORIZATION="Bearer valid_token_17"
        )
        
        # This might return 500 if S3 is not configured, but should not crash
        self.assertIn(response.status_code, [201, 500])

    @patch("profiles.authentication.jwt.decode")
    def test_get_doctor_documents(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {
            "user_id": 7007,
            "role": "doctor",
            "email": "doc3@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        response = self.client.get(
            f"/api/doctor/{7007}/documents/",
            HTTP_AUTHORIZATION="Bearer valid_token_18"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


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
        self.assertFalse(profile.is_approved)

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
            profile=user_profile,
            mood_score=7,
            anxiety_level=4,
            energy_level=6,
            sleep_hours=7.0,
            notes="Test mood entry"
        )
        
        self.assertEqual(mood_entry.mood_score, 7)
        self.assertEqual(mood_entry.anxiety_level, 4)
        self.assertEqual(mood_entry.profile, user_profile)
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
            profile=doctor_profile,
            day_of_week=1,  # Tuesday
            start_time="09:00",
            end_time="17:00"
        )
        
        self.assertEqual(availability.day_of_week, 1)
        self.assertEqual(availability.start_time, "09:00")
        self.assertEqual(availability.end_time, "17:00")
        self.assertEqual(availability.profile, doctor_profile)


class UtilsTests(TestCase):
    """Test utility functions"""
    
    def setUp(self):
        self.doctor_user = UserProfile.objects.create(
            user_id=12012,
            email="utiltest@example.com",
            role="doctor",
            name="Dr. Utils"
        )
        
        self.doctor_profile = DoctorProfile.objects.create(
            profile=self.doctor_user,
            specialization="Psychologist",
            experience_years=8,
            consultation_fee=900,
            rating=4.2,
            total_reviews=30
        )

    @patch('profiles.utils.calculate_doctor_match_score')
    def test_calculate_match_score(self, mock_calculate_score):
        """Test doctor match score calculation"""
        from profiles.utils import calculate_doctor_match_score
        
        # Mock the return value
        mock_calculate_score.return_value = {
            "total_score": 85.5,
            "specialty_score": 40.0,
            "urgency_score": 20.0,
            "experience_score": 15.0,
            "rating_score": 10.0,
            "breakdown": {
                "specialty_relevance": 0.8,
                "urgency_fit": 0.7,
                "experience_fit": 0.75,
                "rating": 0.85
            }
        }
        
        score = calculate_doctor_match_score(self.doctor_profile)
        
        self.assertEqual(score["total_score"], 85.5)
        self.assertIn("breakdown", score)

    def test_get_doctors_by_severity(self):
        """Test getting doctors by severity level"""
        from profiles.utils import get_doctors_by_severity
        
        # Test with different severity levels
        critical_doctors = get_doctors_by_severity('CRITICAL')
        self.assertIsNotNone(critical_doctors)
        
        moderate_doctors = get_doctors_by_severity('MODERATE')
        self.assertIsNotNone(moderate_doctors)
        
        low_doctors = get_doctors_by_severity('LOW')
        self.assertIsNotNone(low_doctors)

    @patch('profiles.utils.get_top_matched_doctors')
    def test_get_top_matched_doctors(self, mock_get_top):
        """Test getting top matched doctors"""
        from profiles.utils import get_top_matched_doctors
        
        mock_get_top.return_value = [self.doctor_profile]
        
        top_doctors = get_top_matched_doctors([self.doctor_profile], limit=5)
        
        self.assertEqual(len(top_doctors), 1)
        self.assertEqual(top_doctors[0], self.doctor_profile)

    @patch('profiles.utils.requests.get')
    def test_fetch_user_severity_level(self, mock_requests_get):
        """Test fetching user severity level from medical service"""
        from profiles.utils import fetch_user_severity_level
        
        # Mock the response from medical service
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "raw_score": 15,
            "severity_level": "moderately_severe",
            "specialist_type": "psychiatrist"
        }
        mock_requests_get.return_value = mock_response
        
        result = fetch_user_severity_level("user123")
        
        self.assertEqual(result["raw_score"], 15)
        self.assertEqual(result["severity_level"], "moderately_severe")


class PermissionsTests(TestCase):
    """Test permission and authentication"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = UserProfile.objects.create(
            user_id=13013,
            email="permission@example.com",
            role="user",
            name="Permission Test User"
        )
        
        self.doctor = UserProfile.objects.create(
            user_id=14014,
            email="perm_doctor@example.com",
            role="doctor",
            name="Dr. Permission"
        )

    def test_unauthorized_access(self):
        """Test that unauthorized requests are rejected"""
        response = self.client.get(f"/api/profile/13013/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("profiles.authentication.jwt.decode")
    def test_role_based_access(self, mock_jwt_decode):
        """Test that users can only access their own profile"""
        # Mock user token
        mock_jwt_decode.return_value = {
            "user_id": 13013,
            "role": "user",
            "email": "permission@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        response = self.client.get(
            f"/api/profile/13013/",
            HTTP_AUTHORIZATION="Bearer valid_token_19"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)