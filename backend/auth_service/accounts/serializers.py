# from rest_framework import serializers
# from django.contrib.auth import get_user_model

# User = get_user_model()


# class RegisterSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#     password = serializers.CharField(min_length=8, write_only=True)
#     role = serializers.ChoiceField(
#         choices=[("user", "user"), ("doctor", "doctor")],
#         default="user"
#     )

#     def validate_email(self, value):
#         if User.objects.filter(email=value).exists():
#             raise serializers.ValidationError("Email already registered.")
#         return value


# class VerifyOTPSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#     otp = serializers.CharField()
#     # ❌ password removed
#     # ❌ role removed
#     # Backend NEVER needed these. They were breaking your validation.


# class LoginSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#     password = serializers.CharField(write_only=True)


from django.contrib.auth import get_user_model
from django.core.validators import MinLengthValidator
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        min_length=8, 
        write_only=True,
        validators=[MinLengthValidator(8, "Password must be at least 8 characters")]
    )
    role = serializers.ChoiceField(
        choices=[("user", "User"), ("doctor", "Doctor")],
        default="user"
    )

    def validate_email(self, value):
        """Check if email is already registered"""
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_password(self, value):
        """Additional password validation"""
        if value.isdigit():
            raise serializers.ValidationError("Password cannot be entirely numeric.")
        return value


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate_email(self, value):
        return value.lower().strip()

    def validate_otp(self, value):
        """Ensure OTP is numeric"""
        if not value.isdigit():
            raise serializers.ValidationError("OTP must be numeric.")
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate_email(self, value):
        return value.lower().strip()


class GoogleAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth authentication"""
    id_token = serializers.CharField(required=True)

    def validate_id_token(self, value):
        if not value or len(value) < 10:
            raise serializers.ValidationError("Invalid ID token format.")
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password request"""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        value = value.lower().strip()
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for password reset"""
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=6, max_length=6)
    new_password = serializers.CharField(
        min_length=8,
        write_only=True,
        validators=[MinLengthValidator(8, "Password must be at least 8 characters")]
    )

    def validate_email(self, value):
        return value.lower().strip()

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP must be numeric.")
        return value

    def validate_new_password(self, value):
        if value.isdigit():
            raise serializers.ValidationError("Password cannot be entirely numeric.")
        return value


class VerifyTokenSerializer(serializers.Serializer):
    """Serializer for token verification"""
    token = serializers.CharField(required=True)

    def validate_token(self, value):
        if not value or len(value) < 10:
            raise serializers.ValidationError("Invalid token format.")
        return value