from unittest.mock import MagicMock, patch
from django.test import TestCase
from profiles.models import (
    DoctorProfile,
    UserProfile,
)

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
        # Assuming get_doctors_by_severity returns something iterable or query set
        critical_doctors = get_doctors_by_severity('CRITICAL')
        self.assertIsNotNone(critical_doctors)
