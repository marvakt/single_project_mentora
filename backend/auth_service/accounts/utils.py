
import os
import random
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import redis
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from jose import JWTError, jwt
from rest_framework import status

User = get_user_model()

# ======================================================
# REDIS CLIENT SETUP
# ======================================================

redis_client = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
)

# ======================================================
# CONFIGURATION CONSTANTS
# ======================================================

OTP_TTL_SECONDS = 5 * 60  # 5 minutes
JWT_SECRET = getattr(settings, 'JWT_SECRET', 'mentora-jwt-secret-2025-change-this')
JWT_ALG = "HS256"
ACCESS_EXPIRE_MINUTES = 15
REFRESH_EXPIRE_DAYS = 7


# ======================================================
# OTP MANAGEMENT
# ======================================================

def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return f"{random.randint(100000, 999999)}"


def store_otp(email: str, data: str) -> None:
    """Store OTP data in Redis with TTL"""
    redis_client.setex(f"otp:{email}", OTP_TTL_SECONDS, data)


def get_stored_otp(email: str) -> Optional[str]:
    """Retrieve OTP data from Redis"""
    return redis_client.get(f"otp:{email}")


def delete_otp(email: str) -> None:
    """Delete OTP data from Redis"""
    redis_client.delete(f"otp:{email}")


def send_otp_email(email: str, otp: str) -> bool:
    """Send OTP via email"""
    try:
        send_mail(
            subject="Your Mentora OTP",
            message=f"Your OTP code is: {otp}\n\nThis code will expire in 5 minutes.",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@mentora.local"),
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send OTP email: {e}")
        return False


# ======================================================
# JWT TOKEN MANAGEMENT
# ======================================================

def create_access_token(data: dict) -> str:
    """Create access token with 15 min expiry"""
    payload = data.copy()
    payload["type"] = "access"
    payload["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_EXPIRE_MINUTES)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def create_refresh_token(data: dict) -> str:
    """Create refresh token with 7 days expiry"""
    payload = data.copy()
    payload["type"] = "refresh"
    payload["exp"] = datetime.utcnow() + timedelta(days=REFRESH_EXPIRE_DAYS)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def verify_jwt_token(token: str) -> Dict[str, Any]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return {"valid": True, "payload": payload}
    except JWTError as e:
        return {"valid": False, "error": str(e)}


def generate_auth_response(user) -> Dict[str, Any]:
    """Generate authentication response with tokens"""
    payload = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
    }
    
    return {
        "access": create_access_token(payload),
        "refresh": create_refresh_token(payload),
        "user": payload,
    }


# ======================================================
# GOOGLE OAUTH
# ======================================================

def verify_google_id_token(id_token: str) -> Optional[dict]:
    """Verify Google ID token and return user info"""
    try:
        resp = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": id_token},
            timeout=5,
        )
        if resp.status_code != 200:
            return None
        return resp.json()
    except Exception as e:
        print(f"Google token verification failed: {e}")
        return None


# ======================================================
# USER SERVICE INTEGRATION
# ======================================================

def create_profile_in_user_service(user_id: int, email: str, role: str) -> bool:
    """Create user profile in user service"""
    USER_SERVICE_URL = getattr(settings, "USER_SERVICE_URL", "http://user_service:8001")
    INTERNAL_SERVICE_TOKEN = getattr(settings, "INTERNAL_SERVICE_TOKEN", "dev-internal")

    try:
        print(f"Making request to: {USER_SERVICE_URL}/api/internal/profile/create/")
        print(f"Headers: X-INTERNAL-TOKEN: {INTERNAL_SERVICE_TOKEN}")
        print(f"Data: user_id={user_id}, email={email}, role={role}")
        
        resp = requests.post(
            f"{USER_SERVICE_URL}/api/internal/profile/create/",
            headers={"X-INTERNAL-TOKEN": INTERNAL_SERVICE_TOKEN},
            json={"user_id": user_id, "email": email, "role": role},
            timeout=5,
        )
        
        print(f"User service response: {resp.status_code} - {resp.text}")
        return resp.status_code in (200, 201)
    except Exception as e:
        print(f"User service profile creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


# ======================================================
# BUSINESS LOGIC HANDLERS
# ======================================================

def handle_registration(validated_data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle user registration process"""
    email = validated_data["email"]
    password = validated_data["password"]
    role = validated_data["role"]

    # Generate and store OTP with registration data
    otp = generate_otp()
    store_otp(email, f"{otp}|{password}|{role}")
    
    # Send OTP email
    if not send_otp_email(email, otp):
        return {
            "data": {"detail": "Failed to send OTP. Please try again."},
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR
        }

    return {
        "data": {"detail": "OTP sent to your email"},
        "status": status.HTTP_200_OK
    }


def handle_otp_verification(validated_data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle OTP verification and user creation"""
    email = validated_data["email"]
    otp = validated_data["otp"]

    # Retrieve stored OTP data
    stored = get_stored_otp(email)
    if not stored:
        return {
            "data": {"detail": "OTP expired or not found"},
            "status": status.HTTP_400_BAD_REQUEST
        }

    # Parse stored data
    try:
        stored_otp, password, role = stored.split("|")
    except ValueError:
        delete_otp(email)
        return {
            "data": {"detail": "Invalid OTP data"},
            "status": status.HTTP_400_BAD_REQUEST
        }

    # Verify OTP
    if stored_otp != otp:
        return {
            "data": {"detail": "Invalid OTP"},
            "status": status.HTTP_400_BAD_REQUEST
        }

    # Create user
    try:
        user = User.objects.create_user(
            email=email,
            password=password,
            role=role,
        )
        user.is_active = True
        user.save()
    except Exception as e:
        delete_otp(email)
        return {
            "data": {"detail": f"User creation failed: {str(e)}"},
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR
        }

    # Create profile in user service
    if not create_profile_in_user_service(user.id, user.email, user.role):
        user.delete()
        delete_otp(email)
        return {
            "data": {"detail": "Profile creation failed. Registration aborted."},
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR
        }

    # Clean up OTP
    delete_otp(email)

    # Generate auth response
    return {
        "data": generate_auth_response(user),
        "status": status.HTTP_201_CREATED
    }


def handle_google_authentication(validated_data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle Google OAuth authentication"""
    id_token = validated_data["id_token"]

    # Verify Google token
    info = verify_google_id_token(id_token)
    if not info or not info.get("email"):
        return {
            "data": {"detail": "Invalid Google token"},
            "status": status.HTTP_400_BAD_REQUEST
        }

    email = info["email"]

    # Get or create user
    user, created = User.objects.get_or_create(
        email=email,
        defaults={"role": "user", "is_active": True},
    )

    if created:
        user.set_unusable_password()
        user.save()

        # Create profile for new user
        if not create_profile_in_user_service(user.id, user.email, user.role):
            user.delete()
            return {
                "data": {"detail": "Profile creation failed"},
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR
            }

    # Generate auth response
    return {
        "data": generate_auth_response(user),
        "status": status.HTTP_200_OK
    }


def handle_password_reset_request(validated_data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle forgot password request"""
    email = validated_data["email"]

    # Generate and store OTP
    otp = generate_otp()
    store_otp(email, otp)

    # Send OTP email
    if not send_otp_email(email, otp):
        return {
            "data": {"detail": "Failed to send OTP. Please try again."},
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR
        }

    return {
        "data": {"detail": "OTP sent to your email"},
        "status": status.HTTP_200_OK
    }


def handle_password_reset(validated_data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle password reset with OTP verification"""
    email = validated_data["email"]
    otp = validated_data["otp"]
    new_password = validated_data["new_password"]

    # Verify OTP
    stored = get_stored_otp(email)
    if not stored or stored != otp:
        return {
            "data": {"detail": "Invalid or expired OTP"},
            "status": status.HTTP_400_BAD_REQUEST
        }

    # Update password
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
    except User.DoesNotExist:
        delete_otp(email)
        return {
            "data": {"detail": "User not found"},
            "status": status.HTTP_404_NOT_FOUND
        }
    except Exception as e:
        delete_otp(email)
        return {
            "data": {"detail": f"Password reset failed: {str(e)}"},
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR
        }

    # Clean up OTP
    delete_otp(email)

    return {
        "data": {"detail": "Password reset successful"},
        "status": status.HTTP_200_OK
    }