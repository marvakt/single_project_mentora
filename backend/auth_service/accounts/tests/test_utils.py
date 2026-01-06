from unittest.mock import MagicMock, patch
from django.test import TestCase
from accounts.utils import create_access_token, generate_otp, verify_jwt_token

class UtilsTests(TestCase):
    """Test utility functions"""

    def test_generate_otp(self):
        """Test OTP generation"""
        otp = generate_otp()
        
        # Check that it's a 6-digit string
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())

    @patch('accounts.utils.redis_client')
    def test_otp_storage_operations(self, mock_redis):
        """Test OTP storage, retrieval, and deletion"""
        from accounts.utils import delete_otp, get_stored_otp, store_otp
        
        email = "test@example.com"
        otp_data = "123456|password|user"
        
        # Test store
        store_otp(email, otp_data)
        mock_redis.setex.assert_called_once()
        
        # Test retrieve
        result = get_stored_otp(email)
        mock_redis.get.assert_called_once()
        
        # Test delete
        delete_otp(email)
        mock_redis.delete.assert_called_once()

    @patch('accounts.utils.requests')
    def test_verify_google_id_token_success(self, mock_requests):
        """Test Google ID token verification success"""
        from accounts.utils import verify_google_id_token
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"email": "google@example.com"}
        mock_requests.get.return_value = mock_response
        
        result = verify_google_id_token("valid_token")
        
        self.assertEqual(result["email"], "google@example.com")

    @patch('accounts.utils.requests')
    def test_verify_google_id_token_failure(self, mock_requests):
        """Test Google ID token verification failure"""
        from accounts.utils import verify_google_id_token
        
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_requests.get.return_value = mock_response
        
        result = verify_google_id_token("invalid_token")
        
        self.assertIsNone(result)

    @patch('accounts.utils.settings')
    @patch('accounts.utils.requests')
    def test_create_profile_in_user_service_success(self, mock_requests, mock_settings):
        """Test user profile creation in user service"""
        from accounts.utils import create_profile_in_user_service
        
        mock_settings.USER_SERVICE_URL = "http://user_service:8001"
        mock_settings.INTERNAL_SERVICE_TOKEN = "test-token"
        
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_requests.post.return_value = mock_response
        
        result = create_profile_in_user_service(1, "test@example.com", "user")
        
        self.assertTrue(result)
        mock_requests.post.assert_called_once()

    @patch('accounts.utils.settings')
    @patch('accounts.utils.requests')
    def test_create_profile_in_user_service_failure(self, mock_requests, mock_settings):
        """Test user profile creation failure in user service"""
        from accounts.utils import create_profile_in_user_service
        
        mock_settings.USER_SERVICE_URL = "http://user_service:8001"
        mock_settings.INTERNAL_SERVICE_TOKEN = "test-token"
        
        mock_requests.post.side_effect = Exception("Connection failed")
        
        result = create_profile_in_user_service(1, "test@example.com", "user")
        
        self.assertFalse(result)

    def test_jwt_token_operations(self):
        """Test JWT token creation and verification"""
        payload = {
            "user_id": 1,
            "email": "jwttest@example.com",
            "role": "user"
        }
        
        # Create token
        token = create_access_token(payload)
        
        # Verify token
        result = verify_jwt_token(token)
        
        self.assertTrue(result["valid"])
        self.assertEqual(result["payload"]["user_id"], 1)
        self.assertEqual(result["payload"]["email"], "jwttest@example.com")

    def test_invalid_jwt_token(self):
        """Test JWT token verification with invalid token"""
        result = verify_jwt_token("invalid.token.here")
        
        self.assertFalse(result["valid"])
        self.assertIn("error", result)
