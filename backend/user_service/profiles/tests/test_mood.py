from unittest.mock import MagicMock, patch
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from profiles.models import MoodEntry, UserProfile

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
            user_profile=self.profile,
            mood_score=7,
            anxiety_level=3,
            energy_level=8,
            sleep_hours=7.5
        )
        
        response = self.client.get(
            f"/api/mood-entries/{self.user_id}/history/",
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
