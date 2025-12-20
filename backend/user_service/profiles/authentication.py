from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from jose import jwt
import time
from django.conf import settings

# Use JWT_SECRET from Django settings instead of environment variable directly
JWT_SECRET = getattr(settings, 'JWT_SECRET', 'mentora-jwt-secret-2025-change-this')
JWT_ALG = "HS256"


class JWTAuthentication(BaseAuthentication):
    """
    Validates JWT issued by auth_service
    """

    def authenticate(self, request):
        print("JWTAuthentication.authenticate called")
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            print("No Authorization header found")
            return None  # unauthenticated

        if not auth_header.startswith("Bearer "):
            print("Invalid auth header format")
            raise AuthenticationFailed("Invalid auth header")

        token = auth_header.split(" ")[1]
        
        # Debug logging
        print(f"JWT_SECRET from settings: {JWT_SECRET}")
        print(f"Token received: {token}")

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
            print(f"Decoded payload: {payload}")
        except Exception as e:
            print(f"JWT decode error: {e}")
            raise AuthenticationFailed("Invalid or expired token")

        if payload.get("type") != "access":
            raise AuthenticationFailed("Invalid token type")

        if payload.get("exp", 0) < int(time.time()):
            raise AuthenticationFailed("Token expired")

        # Attach payload to request
        request.user_data = payload

        # DRF expects (user, auth) tuple — we fake user
        return (payload, token)