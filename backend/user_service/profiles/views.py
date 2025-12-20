from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import (
    UserProfile,
    DoctorProfile,
    DoctorDocument,
    DoctorAvailability,
    Notification,
)

from .serializers import (
    UserProfileSerializer,
    DoctorProfileSerializer,
    DoctorDocumentSerializer,
    DoctorAvailabilitySerializer,
    NotificationSerializer,
)

from .tasks import send_doctor_status_email, notify_admin_new_doctor
from .permissions import (
    IsAuthenticatedJWT,
    IsOwner,
    IsDoctor,
    IsAdmin,
    IsInternalService,
)
from .authentication import JWTAuthentication


# =========================================================
# INTERNAL — PROFILE CREATE (AUTH SERVICE ONLY)
# =========================================================
class CreateProfileInternalAPIView(APIView):
    authentication_classes = []
    permission_classes = [IsInternalService]

    def post(self, request):
        user_id = request.data.get("user_id")
        email = request.data.get("email")
        role = request.data.get("role", "user")

        if not user_id or not email:
            return Response(
                {"detail": "user_id and email required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile, created = UserProfile.objects.get_or_create(
            user_id=user_id,
            defaults={
                "email": email,
                "role": role,
                "status": "active",
            }
        )

        return Response(
            UserProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


# =========================================================
# USER PROFILE
# =========================================================
class GetProfileAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsOwner]

    def get(self, request, user_id):
        print(f"GetProfileAPIView called with user_id: {user_id}")
        if hasattr(request, 'user_data'):
            print(f"Request user_data: {request.user_data}")
        else:
            print("No user_data in request")
            
        profile = get_object_or_404(UserProfile, user_id=user_id)
        print("JWT user_id:", request.user_data["user_id"])
        print("Profile user_id:", profile.user_id)
        
        # Check if user is trying to access their own profile
        if request.user_data["user_id"] != profile.user_id:
            return Response(
                {"detail": f"Access denied. You can only access your own profile. Requested user_id: {user_id}, Your user_id: {request.user_data['user_id']}"},
                status=status.HTTP_403_FORBIDDEN
            )

        self.check_object_permissions(request, profile)
        return Response(UserProfileSerializer(profile).data)
    


class UpdateProfileAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsOwner]

    def put(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        
        # Check if user is trying to access their own profile
        if request.user_data["user_id"] != profile.user_id:
            return Response(
                {"detail": f"Access denied. You can only update your own profile. Requested user_id: {user_id}, Your user_id: {request.user_data['user_id']}"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.check_object_permissions(request, profile)

        serializer = UserProfileSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


# =========================================================
# DOCTOR PROFILE (DOCTOR ONLY)
# =========================================================
class CreateOrUpdateDoctorProfileAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor, IsOwner]

    def post(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        self.check_object_permissions(request, profile)

        doctor_profile, created = DoctorProfile.objects.get_or_create(profile=profile)
        
        # Check if this is first time completing profile
        was_incomplete = not (doctor_profile.specialization and profile.name and profile.phone)

        serializer = DoctorProfileSerializer(
            doctor_profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # ✅ Notify admin when doctor completes profile for first time
        is_now_complete = (doctor_profile.specialization and profile.name and profile.phone)
        if doctor_profile.doctor_status == 'pending' and was_incomplete and is_now_complete:
            notify_admin_new_doctor.delay(
                doctor_name=profile.name or profile.email.split('@')[0],
                doctor_email=profile.email,
                doctor_id=profile.user_id
            )

        return Response(serializer.data)


# =========================================================
# DOCTOR DOCUMENTS
# =========================================================
class UploadDoctorDocumentAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor, IsOwner]

    def post(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        self.check_object_permissions(request, profile)

        data = {**request.data, "profile": profile.id}
        serializer = DoctorDocumentSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=201)


# ✅ FIXED: Allow admin to view doctor documents
class ListDoctorDocumentsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        
        # Allow admin or the doctor themselves
        user_role = request.user_data.get('role')
        requesting_user_id = request.user_data.get('user_id')
        
        if user_role == 'admin':
            # Admin can view any doctor's documents
            pass
        elif user_role == 'doctor' and requesting_user_id == user_id:
            # Doctor can view their own documents
            pass
        else:
            return Response(
                {"detail": "You don't have permission to view these documents"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        docs = profile.documents.all()
        return Response(DoctorDocumentSerializer(docs, many=True).data)


# =========================================================
# DOCTOR AVAILABILITY
# =========================================================
class AddAvailabilityAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor, IsOwner]

    def post(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        self.check_object_permissions(request, profile)
        get_object_or_404(DoctorProfile, profile=profile)

        data = {**request.data, "profile": profile.id}
        serializer = DoctorAvailabilitySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        else:
            return Response({"errors": serializer.errors}, status=400)


class DeleteAvailabilityAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor]

    def delete(self, request, availability_id):
        availability = get_object_or_404(
            DoctorAvailability,
            id=availability_id,
            profile__user_id=request.user_data["user_id"],
        )
        availability.delete()
        return Response({"detail": "Deleted"})


class ListAvailabilityAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        availability = profile.availability.all()
        return Response(
            DoctorAvailabilitySerializer(availability, many=True).data
        )


# =========================================================
# ADMIN — DOCTOR APPROVAL
# =========================================================
class ApproveDoctorAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsAdmin]

    def post(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        doctor = get_object_or_404(DoctorProfile, profile=profile)

        doctor.doctor_status = "approved"
        doctor.save()

        # ✅ Send email notification to doctor
        send_doctor_status_email.delay(profile.email, "approved")

        return Response({"detail": "Doctor approved"})


class RejectDoctorAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsAdmin]

    def post(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        doctor = get_object_or_404(DoctorProfile, profile=profile)

        doctor.doctor_status = "rejected"
        doctor.save()

        # ✅ Send email notification to doctor
        send_doctor_status_email.delay(profile.email, "rejected")

        return Response({"detail": "Doctor rejected"})


# =========================================================
# ADMIN — USER MANAGEMENT
# =========================================================
class UserManagementListAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsAdmin]

    def get(self, request):
        search = request.GET.get("search", "")
        role = request.GET.get("role")
        status_filter = request.GET.get("status")

        q = UserProfile.objects.all()

        if search:
            q = q.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(user_id__icontains=search)
            )

        if role and role != "all":
            q = q.filter(role=role)

        if status_filter == "active":
            q = q.filter(onboarding_status=100)
        elif status_filter == "pending":
            q = q.filter(onboarding_status__lt=100)

        return Response(UserProfileSerializer(q, many=True).data)


# =========================================================
# NOTIFICATIONS
# =========================================================
class NotificationListAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsOwner]

    def get(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        self.check_object_permissions(request, profile)

        notifications = Notification.objects.filter(user_profile=profile)
        return Response(NotificationSerializer(notifications, many=True).data)


# =========================================================
# PUBLIC — APPROVED DOCTORS LIST
# =========================================================
class PublicDoctorListAPIView(APIView):
    permission_classes = []

    def get(self, request):
        doctors = DoctorProfile.objects.filter(
            doctor_status="approved",
            profile__onboarding_status=100
        ).select_related("profile")

        data = []
        for d in doctors:
            data.append({
                "user_id": d.profile.user_id,
                "name": d.profile.name,
                "specialization": d.specialization,
                "experience": d.experience_years,
                "consultation_fee": d.consultation_fee,
            })

        return Response(data)

