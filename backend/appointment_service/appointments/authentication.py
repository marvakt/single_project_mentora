"""
JWT Authentication for appointment_service.

Validates JWT tokens via HTTP call to auth_service.
Extracts user_id and role from JWT payload ONLY.
"""
import requests
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings


class JWTAuthentication(BaseAuthentication):
    """
    Validates JWT via auth_service HTTP endpoint.
    Extracts user_id and role from JWT payload ONLY.
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return None  # unauthenticated

        if not auth_header.startswith("Bearer "):
            raise AuthenticationFailed("Invalid authorization header format")

        token = auth_header.split(" ")[1]

        try:
            # Call auth_service to verify token
            response = requests.post(
                f"{settings.AUTH_SERVICE_BASE_URL}/verify-token/",
                json={"token": token},
                timeout=3,
            )
        except requests.RequestException:
            raise AuthenticationFailed("Auth service unavailable")

        if response.status_code != 200:
            raise AuthenticationFailed("Invalid or expired token")

        payload = response.json()

        # Attach payload to request for use in views
        request.user_data = payload

        # DRF expects (user, auth) tuple
        return (payload, token)

