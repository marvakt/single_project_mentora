from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()

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
