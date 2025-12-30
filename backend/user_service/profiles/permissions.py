from rest_framework.permissions import BasePermission
from django.conf import settings

class IsAuthenticatedJWT(BasePermission):
    """
    Checks JWT was decoded by authentication layer
    """

    def has_permission(self, request, view):
        print(f"IsAuthenticatedJWT check: {hasattr(request, 'user_data')}")
        result = hasattr(request, "user_data")
        print(f"IsAuthenticatedJWT result: {result}")
        return result


class IsOwner(BasePermission):
    """
    User can access ONLY their own profile
    """

    def has_object_permission(self, request, view, obj):
        print(f"IsOwner check - obj.user_id: {obj.user_id}, request.user_data['user_id']: {request.user_data['user_id']}")
        result = obj.user_id == request.user_data["user_id"]
        print(f"IsOwner result: {result}")
        return result


class IsDoctor(BasePermission):
    """
    Allows access only to doctors
    """

    def has_permission(self, request, view):
        return (
            hasattr(request, "user_data")
            and request.user_data.get("role") == "doctor"
        )


class IsAdmin(BasePermission):
    """
    Allows access only to admins
    """

    def has_permission(self, request, view):
        return (
            hasattr(request, "user_data")
            and request.user_data.get("role") == "admin"
        )

class IsInternalService(BasePermission):
    def has_permission(self, request, view):
        # Get the token from settings
        expected_token = getattr(settings, "INTERNAL_SERVICE_TOKEN", "dev-internal")
        provided_token = request.headers.get("X-INTERNAL-TOKEN")
        
        # Debug logging
        print(f"Expected token: {expected_token}")
        print(f"Provided token: {provided_token}")
        
        return provided_token == expected_token


class IsAuthenticatedJWTOrInternalService(BasePermission):
    def has_permission(self, request, view):
        # Check if it's an internal service request first
        expected_token = getattr(settings, "INTERNAL_SERVICE_TOKEN", "dev-internal")
        provided_token = request.headers.get("X-INTERNAL-TOKEN")
        
        if provided_token == expected_token:
            return True
        
        # If not internal service, check JWT authentication
        return hasattr(request, "user_data")