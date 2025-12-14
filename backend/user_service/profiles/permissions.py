from rest_framework.permissions import BasePermission


class IsAuthenticatedJWT(BasePermission):
    """
    Checks JWT was decoded by authentication layer
    """

    def has_permission(self, request, view):
        return hasattr(request, "user_data")


class IsOwner(BasePermission):
    """
    User can access ONLY their own profile
    """

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user_data["user_id"]


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
