from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from accounts.utils import generate_otp, verify_jwt_token, create_access_token
from accounts.models import ROLE_CHOICES

User = get_user_model()

class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = "/api/register/"
        self.verify_url = "/api/verify-otp/"
        self.login_url = "/api/login/"
        self.google_auth_url = "/api/google-auth/"
        self.forgot_password_url = "/api/forgot-password/"
        self.reset_password_url = "/api/reset-password/"
        self.verify_token_url = "/api/verify-token/"
        
        # Test data
        self.user_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "role": "user"
        }
        self.otp = "123456"

    @patch("accounts.utils.generate_otp")
    @patch("accounts.utils.store_otp")
    @patch("accounts.utils.send_otp_email")
    def test_register_user_success(self, mock_send_email, mock_store_otp, mock_generate_otp):
        """Test successful user registration initiation"""
        # Setup mocks
        mock_generate_otp.return_value = self.otp
        mock_send_email.return_value = True
        
        response = self.client.post(self.register_url, self.user_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["detail"], "OTP sent to your email")
        
        # Verify mocks were called
        mock_generate_otp.assert_called_once()
        mock_store_otp.assert_called_once()
        mock_send_email.assert_called_once_with(self.user_data["email"], self.otp)

    def test_register_duplicate_email(self):
        """Test registration with existing email"""
        # Create user first
        User.objects.create_user(
            email=self.user_data["email"],
            password=self.user_data["password"],
            role="user"
        )
        
        response = self.client.post(self.register_url, self.user_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    @patch("accounts.utils.get_stored_otp")
    @patch("accounts.utils.create_profile_in_user_service")
    @patch("accounts.utils.delete_otp")
    @patch("accounts.utils.generate_auth_response")
    def test_verify_otp_success(self, mock_auth_resp, mock_delete, mock_create_profile, mock_get_otp):
        """Test successful OTP verification"""
        # Mock stored data format: "otp|password|role"
        stored_data = f"{self.otp}|{self.user_data['password']}|{self.user_data['role']}"
        mock_get_otp.return_value = stored_data
        mock_create_profile.return_value = True
        mock_auth_resp.return_value = {"access": "token", "refresh": "token", "user": {}}
        
        data = {
            "email": self.user_data["email"],
            "otp": self.otp
        }
        
        response = self.client.post(self.verify_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=self.user_data["email"]).exists())
        self.assertTrue(User.objects.get(email=self.user_data["email"]).is_active)

    @patch("accounts.utils.get_stored_otp")
    def test_verify_otp_invalid(self, mock_get_otp):
        """Test verification with incorrect OTP"""
        stored_data = f"{self.otp}|{self.user_data['password']}|{self.user_data['role']}"
        mock_get_otp.return_value = stored_data
        
        data = {
            "email": self.user_data["email"],
            "otp": "000000" # Wrong OTP
        }
        
        response = self.client.post(self.verify_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Invalid OTP")

    def test_login_success(self):
        """Test successful login"""
        # Create user
        User.objects.create_user(
            email=self.user_data["email"],
            password=self.user_data["password"],
            role="user"
        )
        
        data = {
            "email": self.user_data["email"],
            "password": self.user_data["password"],
        }
        
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        User.objects.create_user(
            email=self.user_data["email"],
            password=self.user_data["password"],
            role="user"
        )
        
        data = {
            "email": self.user_data["email"],
            "password": "wrongpassword"
        }
        
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ============================ ADDITIONAL AUTH TESTS ============================

    def test_register_user_with_doctor_role(self):
        """Test successful user registration with doctor role"""
        doctor_data = {
            "email": "doctor@example.com",
            "password": "testpassword123",
            "role": "doctor"
        }
        
        with patch("accounts.utils.generate_otp") as mock_generate_otp, \
             patch("accounts.utils.store_otp") as mock_store_otp, \
             patch("accounts.utils.send_otp_email") as mock_send_email:
            
            mock_generate_otp.return_value = self.otp
            mock_send_email.return_value = True
            
            response = self.client.post(self.register_url, doctor_data)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data["detail"], "OTP sent to your email")

    def test_register_user_invalid_data(self):
        """Test registration with invalid data"""
        invalid_data = {
            "email": "",  # Empty email
            "password": "",  # Empty password
            "role": "invalid_role"  # Invalid role
        }
        
        response = self.client.post(self.register_url, invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("password", response.data)

    @patch("accounts.utils.get_stored_otp")
    @patch("accounts.utils.create_profile_in_user_service")
    @patch("accounts.utils.delete_otp")
    def test_verify_otp_expired(self, mock_delete, mock_create_profile, mock_get_otp):
        """Test OTP verification with expired OTP"""
        mock_get_otp.return_value = None  # No OTP stored
        
        data = {
            "email": self.user_data["email"],
            "otp": self.otp
        }
        
        response = self.client.post(self.verify_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "OTP expired or not found")

    @patch("accounts.utils.get_stored_otp")
    @patch("accounts.utils.create_profile_in_user_service")
    @patch("accounts.utils.delete_otp")
    @patch("accounts.utils.generate_auth_response")
    def test_verify_otp_profile_creation_failure(self, mock_auth_resp, mock_delete, mock_create_profile, mock_get_otp):
        """Test OTP verification when profile creation fails"""
        stored_data = f"{self.otp}|{self.user_data['password']}|{self.user_data['role']}"
        mock_get_otp.return_value = stored_data
        mock_create_profile.return_value = False  # Profile creation fails
        mock_auth_resp.return_value = {"access": "token", "refresh": "token", "user": {}}
        
        data = {
            "email": self.user_data["email"],
            "otp": self.otp
        }
        
        response = self.client.post(self.verify_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["detail"], "Profile creation failed. Registration aborted.")
        # Verify that the user was deleted due to profile creation failure
        self.assertFalse(User.objects.filter(email=self.user_data["email"]).exists())

    def test_login_inactive_user(self):
        """Test login with inactive user"""
        User.objects.create_user(
            email=self.user_data["email"],
            password=self.user_data["password"],
            role="user",
            is_active=False  # User is inactive
        )
        
        data = {
            "email": self.user_data["email"],
            "password": self.user_data["password"]
        }
        
        response = self.client.post(self.login_url, data)
        
        # Even inactive users should be able to authenticate since the model doesn't enforce this
        # If there's specific logic to prevent inactive user login, it would fail here
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("accounts.utils.verify_google_id_token")
    @patch("accounts.utils.create_profile_in_user_service")
    def test_google_auth_success(self, mock_create_profile, mock_verify_token):
        """Test successful Google authentication"""
        mock_verify_token.return_value = {"email": "googleuser@example.com"}
        mock_create_profile.return_value = True
        
        data = {"id_token": "valid_google_token"}
        response = self.client.post(self.google_auth_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    @patch("accounts.utils.verify_google_id_token")
    def test_google_auth_invalid_token(self, mock_verify_token):
        """Test Google authentication with invalid token"""
        mock_verify_token.return_value = None  # Invalid token
        
        data = {"id_token": "invalid_google_token"}
        response = self.client.post(self.google_auth_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Invalid Google token")

    def test_forgot_password_success(self):
        """Test successful forgot password request"""
        User.objects.create_user(
            email=self.user_data["email"],
            password=self.user_data["password"],
            role="user"
        )
        
        with patch("accounts.utils.generate_otp") as mock_generate_otp, \
             patch("accounts.utils.store_otp") as mock_store_otp, \
             patch("accounts.utils.send_otp_email") as mock_send_email:
            
            mock_generate_otp.return_value = self.otp
            mock_send_email.return_value = True
            
            data = {"email": self.user_data["email"]}
            response = self.client.post(self.forgot_password_url, data)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data["detail"], "OTP sent to your email")

    def test_forgot_password_user_not_found(self):
        """Test forgot password request with non-existent user"""
        data = {"email": "nonexistent@example.com"}
        response = self.client.post(self.forgot_password_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "User not found")

    @patch("accounts.utils.get_stored_otp")
    @patch("accounts.utils.delete_otp")
    def test_reset_password_success(self, mock_delete, mock_get_otp):
        """Test successful password reset"""
        # Create user first
        User.objects.create_user(
            email=self.user_data["email"],
            password=self.user_data["password"],
            role="user"
        )
        
        # Mock OTP verification
        mock_get_otp.return_value = self.otp
        
        data = {
            "email": self.user_data["email"],
            "otp": self.otp,
            "new_password": "newpassword123"
        }
        
        response = self.client.post(self.reset_password_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["detail"], "Password reset successful")
        
        # Verify password was updated
        user = User.objects.get(email=self.user_data["email"])
        self.assertTrue(user.check_password("newpassword123"))

    @patch("accounts.utils.get_stored_otp")
    def test_reset_password_invalid_otp(self, mock_get_otp):
        """Test password reset with invalid OTP"""
        mock_get_otp.return_value = "wrong_otp"  # Different from provided OTP
        
        data = {
            "email": self.user_data["email"],
            "otp": self.otp,
            "new_password": "newpassword123"
        }
        
        response = self.client.post(self.reset_password_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Invalid or expired OTP")

    def test_verify_token_valid(self):
        """Test token verification with valid token"""
        # Create a valid token
        payload = {
            "user_id": 1,
            "email": "test@example.com",
            "role": "user",
            "type": "access"
        }
        token = create_access_token(payload)
        
        data = {"token": token}
        response = self.client.post(self.verify_token_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user_id"], 1)
        self.assertEqual(response.data["email"], "test@example.com")

    def test_verify_token_invalid(self):
        """Test token verification with invalid token"""
        data = {"token": "invalid_token"}
        response = self.client.post(self.verify_token_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["detail"], "Invalid token")


class UserModelTests(TestCase):
    """Test User model functionality"""

    def test_user_model_creation(self):
        """Test User model creation"""
        user = User.objects.create_user(
            email="modeltest@example.com",
            password="testpass123",
            role="user"
        )
        
        self.assertEqual(user.email, "modeltest@example.com")
        self.assertEqual(user.role, "user")
        self.assertTrue(user.check_password("testpass123"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_user_model_string_representation(self):
        """Test User model string representation"""
        user = User.objects.create_user(
            email="stringtest@example.com",
            password="testpass123",
            role="doctor"
        )
        
        expected_str = "stringtest@example.com (doctor)"
        self.assertEqual(str(user), expected_str)

    def test_superuser_creation(self):
        """Test superuser creation"""
        admin_user = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123"
        )
        
        self.assertEqual(admin_user.email, "admin@example.com")
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertEqual(admin_user.role, "admin")

    def test_user_manager_create_user_without_email(self):
        """Test User manager raises error when email is not provided"""
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="testpass123")


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
        from accounts.utils import store_otp, get_stored_otp, delete_otp
        
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