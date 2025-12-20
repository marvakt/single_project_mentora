# import os, random, time
# import redis
# from django.conf import settings
# from datetime import timedelta
# from jose import jwt
# import requests
# from django.core.mail import send_mail  # or custom provider

# REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
# REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
# redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# OTP_TTL_SECONDS = 5 * 60  # 5 minutes

# def generate_otp():
#     return f"{random.randint(100000,999999)}"

# def store_otp(email, otp):
#     key = f"otp:{email}"
#     redis_client.setex(key, OTP_TTL_SECONDS, otp)

# def get_stored_otp(email):
#     return redis_client.get(f"otp:{email}")

# def delete_otp(email):
#     redis_client.delete(f"otp:{email}")

# # Simple email send (dev) — replace with real provider
# def send_otp_email(email, otp):
#     subject = "Your Mentora OTP"
#     message = f"Your OTP: {otp}"
#     from_email = os.getenv("DEFAULT_FROM_EMAIL", "no-reply@mentora.local")
#     # For dev we use Django send_mail; ensure EMAIL_* configured or stub this
#     try:
#         send_mail(subject, message, from_email, [email])
#     except Exception:
#         # fallback: log or print
#         print("EMAIL:", email, otp)

# # JWT creation using python-jose
# JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret")
# JWT_ALG = "HS256"
# ACCESS_EXPIRE_MINUTES = int(os.getenv("ACCESS_EXPIRE_MINUTES", 15))
# REFRESH_EXPIRE_DAYS = int(os.getenv("REFRESH_EXPIRE_DAYS", 7))

# def create_access_token(data: dict):
#     payload = data.copy()
#     payload.update({"exp": int(time.time()) + ACCESS_EXPIRE_MINUTES * 60, "type": "access"})
#     return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

# def create_refresh_token(data: dict):
#     payload = data.copy()
#     payload.update({"exp": int(time.time()) + REFRESH_EXPIRE_DAYS * 24 * 3600, "type": "refresh"})
#     return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

# # Google token verification (simple)
# def verify_google_id_token(id_token):
#     # Use Google API tokeninfo endpoint (simple) or google.oauth2.id_token.verify_oauth2_token
#     try:
#         r = requests.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token}, timeout=5)
#         if r.status_code != 200:
#             return None
#         data = r.json()
#         # data['email_verified'] might be 'true'
#         return data
#     except Exception:
#         return None

# # Call user_service to create blank profile (internal)
# # def create_profile_in_user_service(user_id, email, role):
# #     USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:8001")
# #     # If you have internal auth token, include in headers
# #     try:
# #         resp = requests.post(f"{USER_SERVICE_URL}/api/internal/profile/create", json={
# #             "user_id": user_id,
# #             "email": email,
# #             "role": role
# #         }, timeout=5)
# #         return resp.status_code == 201 or resp.status_code == 200
# #     except Exception as e:
# #         print("user_service create profile failed", e)
# #         return False


# def create_profile_in_user_service(user_id, email, role):
#     USER_SERVICE_URL = os.getenv(
#         "USER_SERVICE_URL",
#         "http://mentora_user_service:8001"
#     )

#     try:
#         resp = requests.post(
#             f"{USER_SERVICE_URL}/api/internal/profile/create/",
#             headers={
#                 "X-INTERNAL-TOKEN": os.getenv("INTERNAL_SERVICE_TOKEN", "dev-internal")
#             },
#             json={
#                 "user_id": user_id,
#                 "email": email,
#                 "role": role
#             },
#             timeout=5
#         )

#         if resp.status_code not in (200, 201):
#             print("user_service error:", resp.status_code, resp.text)

#         return resp.status_code in (200, 201)

#     except Exception as e:
#         print("user_service create profile failed:", e)
#         return False


import random
import requests
import redis
import os
from datetime import datetime, timedelta

from django.conf import settings
from django.core.mail import send_mail
from jose import jwt

# ======================================================
# REDIS (OTP) — SINGLE SOURCE OF TRUTH
# ======================================================

redis_client = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
)

OTP_TTL_SECONDS = 5 * 60  # 5 minutes


def generate_otp():
    return f"{random.randint(100000, 999999)}"


def store_otp(email: str, otp: str) -> None:
    redis_client.setex(f"otp:{email}", OTP_TTL_SECONDS, otp)


def get_stored_otp(email: str) -> str | None:
    return redis_client.get(f"otp:{email}")


def delete_otp(email: str) -> None:
    redis_client.delete(f"otp:{email}")


def send_otp_email(email: str, otp: str) -> None:
    send_mail(
        subject="Your Mentora OTP",
        message=f"Your OTP: {otp}",
        from_email=settings.DEFAULT_FROM_EMAIL
        if hasattr(settings, "DEFAULT_FROM_EMAIL")
        else "no-reply@mentora.local",
        recipient_list=[email],
        fail_silently=False,
    )


# ======================================================
# JWT
# ======================================================

JWT_SECRET = getattr(settings, 'JWT_SECRET', 'mentora-jwt-secret-2025-change-this')
JWT_ALG = "HS256"
ACCESS_EXPIRE_MINUTES = 15
REFRESH_EXPIRE_DAYS = 7


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["type"] = "access"
    payload["exp"] = datetime.utcnow() + timedelta(
        minutes=ACCESS_EXPIRE_MINUTES
    )
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload["type"] = "refresh"
    payload["exp"] = datetime.utcnow() + timedelta(
        days=REFRESH_EXPIRE_DAYS
    )
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


# ======================================================
# GOOGLE AUTH
# ======================================================

def verify_google_id_token(id_token: str) -> dict | None:
    try:
        resp = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": id_token},
            timeout=5,
        )
        if resp.status_code != 200:
            return None
        return resp.json()
    except Exception:
        return None


# ======================================================
# USER SERVICE — AUTO PROFILE CREATE
# ======================================================

def create_profile_in_user_service(user_id: int, email: str, role: str) -> bool:
    from django.conf import settings
    
    USER_SERVICE_URL = getattr(
        settings,
        "USER_SERVICE_URL",
        "http://user_service:8001",
    )
    
    # Get the internal service token from settings
    INTERNAL_SERVICE_TOKEN = getattr(
        settings,
        "INTERNAL_SERVICE_TOKEN",
        "dev-internal"
    )

    try:
        print(f"Making request to: {USER_SERVICE_URL}/api/internal/profile/create/")
        print(f"Headers: X-INTERNAL-TOKEN: {INTERNAL_SERVICE_TOKEN}")
        print(f"Data: user_id={user_id}, email={email}, role={role}")
        
        resp = requests.post(
            f"{USER_SERVICE_URL}/api/internal/profile/create/",
            headers={
                "X-INTERNAL-TOKEN": INTERNAL_SERVICE_TOKEN
            },
            json={
                "user_id": user_id,
                "email": email,
                "role": role,
            },
            timeout=5,
        )
        print(f"User service response: {resp.status_code} - {resp.text}")
        return resp.status_code in (200, 201)
    except Exception as e:
        print("User service profile creation failed:", e)
        import traceback
        traceback.print_exc()
        return False
