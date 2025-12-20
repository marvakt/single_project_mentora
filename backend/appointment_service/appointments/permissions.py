"""
RBAC Permissions for appointment_service V1.

Enforces role-based access control:
- user: create, cancel, list own appointments
- doctor: list appointments assigned to them
- admin: read-only access (optional)
"""
from rest_framework.permissions import BasePermission


class IsAuthenticatedJWT(BasePermission):
    """
    Requires valid JWT authentication.
    """

    def has_permission(self, request, view):
        return hasattr(request, "user_data") and request.user_data is not None


class IsUserRole(BasePermission):
    """
    Requires role='user'.
    """

    def has_permission(self, request, view):
        if not hasattr(request, "user_data"):
            return False
        return request.user_data.get("role") == "user"


class IsDoctorRole(BasePermission):
    """
    Requires role='doctor'.
    """

    def has_permission(self, request, view):
        if not hasattr(request, "user_data"):
            return False
        return request.user_data.get("role") == "doctor"


class IsAdminRole(BasePermission):
    """
    Requires role='admin'.
    """

    def has_permission(self, request, view):
        if not hasattr(request, "user_data"):
            return False
        return request.user_data.get("role") == "admin"


class IsOwnerOrDoctor(BasePermission):
    """
    Allows access if user owns the appointment OR is the assigned doctor.
    """

    def has_object_permission(self, request, view, obj):
        if not hasattr(request, "user_data"):
            return False

        user_id = request.user_data.get("user_id")
        role = request.user_data.get("role")

        # Owner can access
        if str(obj.user_id) == str(user_id):
            return True

        # Assigned doctor can access
        if role == "doctor" and str(obj.doctor_id) == str(user_id):
            return True

        return False

