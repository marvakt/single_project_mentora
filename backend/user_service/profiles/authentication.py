from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from jose import jwt
import os
import time

JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret")
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
            raise AuthenticationFailed("Invalid auth header")

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        except Exception:
            raise AuthenticationFailed("Invalid or expired token")

        if payload.get("type") != "access":
            raise AuthenticationFailed("Invalid token type")

        if payload.get("exp", 0) < int(time.time()):
            raise AuthenticationFailed("Token expired")

        # Attach payload to request
        request.user_data = payload

        # DRF expects (user, auth) tuple — we fake user
        return (payload, token)
