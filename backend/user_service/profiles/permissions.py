from django.conf import settings
from rest_framework.permissions import BasePermission


class IsAuthenticatedJWT(BasePermission):
    """
    Checks JWT was decoded by authentication layer
    """

    def has_permission(self, request, view):
      
        has_user_data = hasattr(request, "user_data")
        
        has_authenticated_user = hasattr(request, 'user') and request.user and request.user.is_authenticated
        return has_user_data or has_authenticated_user


class IsOwner(BasePermission):
    """
    User can access ONLY their own profile
    """

    def has_object_permission(self, request, view, obj):
       
        if hasattr(request, 'user_data'):
           
            return obj.user_id == request.user_data["user_id"]
        elif hasattr(request, 'user') and request.user.is_authenticated:
          
            return obj.user_id == request.user.id
        return False


class IsDoctor(BasePermission):
    """
    Allows access only to doctors
    """

    def has_permission(self, request, view):
     
        if hasattr(request, "user_data"):
            return request.user_data.get("role") == "doctor"
        elif hasattr(request, 'user') and request.user.is_authenticated:
            return getattr(request.user, 'role', None) == "doctor"
        return False


class IsAdmin(BasePermission):
    """
    Allows access only to admins
    """

    def has_permission(self, request, view):
       
        if hasattr(request, "user_data"):
            return request.user_data.get("role") == "admin"
        elif hasattr(request, 'user') and request.user.is_authenticated:
            return getattr(request.user, 'role', None) == "admin"
        return False

class IsInternalService(BasePermission):
    def has_permission(self, request, view):
     
        expected_token = getattr(settings, "INTERNAL_SERVICE_TOKEN", "dev-internal")
        provided_token = request.headers.get("X-INTERNAL-TOKEN")
        
        
        print(f"Expected token: {expected_token}")
        print(f"Provided token: {provided_token}")
        
        return provided_token == expected_token


class IsAuthenticatedJWTOrInternalService(BasePermission):
    def has_permission(self, request, view):
       
        expected_token = getattr(settings, "INTERNAL_SERVICE_TOKEN", "dev-internal")
        provided_token = request.headers.get("X-INTERNAL-TOKEN")
        
        if provided_token == expected_token:
            return True
        
   
        has_user_data = hasattr(request, "user_data")
        has_authenticated_user = hasattr(request, 'user') and request.user and request.user.is_authenticated
        return has_user_data or has_authenticated_user