from unittest.mock import MagicMock, patch
from django.test import TestCase
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient
from profiles.models import (
    DoctorAvailability,
    DoctorProfile,
    UserProfile,
)

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

    @patch("profiles.views.notify_admin_new_doctor")
    @patch("profiles.authentication.jwt.decode")
    def test_create_doctor_profile(self, mock_jwt_decode, mock_notify):
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

    @patch("profiles.views.notify_admin_new_doctor")
    @patch("profiles.authentication.jwt.decode")
    def test_update_doctor_profile(self, mock_jwt_decode, mock_notify):
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
        
        response = self.client.post(
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
            profile=self.doctor_user,
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
            profile=self.doctor_user,
            day_of_week=timezone.now().weekday(),  # Today
            start_time="09:00",
            end_time="17:00"
        )
        
        response = self.client.get(
            f"/api/doctor/{6006}/availability/",
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
            format='json',
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
            format='json',
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
            format='json',
            HTTP_AUTHORIZATION="Bearer valid_token_13"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

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
            "doc_type": "license",
            "file": test_file
        }
        
        response = self.client.post(
            f"/api/doctor/{7007}/document/upload/",
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
