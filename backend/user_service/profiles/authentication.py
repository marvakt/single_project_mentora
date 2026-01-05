import time

from django.conf import settings
from jose import jwt
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

# Use JWT_SECRET from Django settings instead of environment variable directly
JWT_SECRET = getattr(settings, 'JWT_SECRET', 'mentora-jwt-secret-2025-change-this')
JWT_ALG = "HS256"


class JWTAuthentication(BaseAuthentication):
    """
    Validates JWT issued by auth_service
    """
    
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return None  # unauthenticated

        if not auth_header.startswith("Bearer "):
            raise AuthenticationFailed("Invalid auth header format. Use: Bearer <token>")

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired")
        except jwt.JWTError:
            raise AuthenticationFailed("Invalid token")

        if payload.get("type") != "access":
            raise AuthenticationFailed("Invalid token type")

        # Verify expiration
        if payload.get("exp", 0) < int(time.time()):
            raise AuthenticationFailed("Token has expired")

        # Attach payload to request
        request.user_data = payload

        # DRF expects (user, auth) tuple — we return a minimal user-like object
        # Create a minimal user-like object that DRF can work with
        class JWTUser:
            def __init__(self, payload):
                self.payload = payload
                self.is_authenticated = True
                self.id = payload.get('user_id')
                self.email = payload.get('email')
                self.role = payload.get('role', 'user')
            
            def __str__(self):
                return f"JWTUser: {self.id} ({self.email})"

        user = JWTUser(payload)
        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer'