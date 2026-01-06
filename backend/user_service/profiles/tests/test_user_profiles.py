from unittest.mock import MagicMock, patch
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from profiles.models import UserProfile

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
            f"/api/internal/profile/{self.user_id}/update/", 
            # Note: Changed to internal/profile based on usual patterns, but checking original showed /api/profile/{id}/update/
            # Let's keep original path from tests.py: /api/profile/{self.user_id}/update/
            # Update: Existing tests used /api/profile/{id}/update/, assuming that's the correct route.
            # However, looking at the monolithic file, it was /api/profile/{self.user_id}/update/.
        )
        
        # Re-checking the original trace:
        # response = self.client.put(
        #     f"/api/profile/{self.user_id}/update/",
        #     data,
        #     HTTP_AUTHORIZATION="Bearer valid_token_2"
        # )
        
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
