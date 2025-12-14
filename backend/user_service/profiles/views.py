# # profiles/views.py
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status, permissions
# from django.shortcuts import get_object_or_404
# from django.db.models import Q

# from .models import (
#     UserProfile,
#     DoctorProfile,
#     DoctorDocument,
#     DoctorAvailability,
#     Notification,
# )

# from .serializers import (
#     UserProfileSerializer,
#     DoctorProfileSerializer,
#     DoctorDocumentSerializer,
#     DoctorAvailabilitySerializer,
#     NotificationSerializer,
# )

# # ============================================================================
# # INTERNAL ENDPOINT (called by auth_service)
# # ============================================================================
# class CreateProfileInternalAPIView(APIView):
#     permission_classes = []
#     authentication_classes = []  # Internal only (secure by Docker network)

#     def post(self, request):
#         """
#         request = { user_id, email, role }
#         """
#         serializer = UserProfileSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()

#         return Response(serializer.data, status=201)


# # ============================================================================
# # USER PROFILE — GET + UPDATE
# # ============================================================================
# class GetProfileAPIView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def get(self, request, user_id):
#         profile = get_object_or_404(UserProfile, user_id=user_id)
#         return Response(UserProfileSerializer(profile).data)


# class UpdateProfileAPIView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def put(self, request, user_id):
#         profile = get_object_or_404(UserProfile, user_id=user_id)
#         serializer = UserProfileSerializer(profile, data=request.data, partial=True)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response(serializer.data)


# # ============================================================================
# # DOCTOR PROFILE MANAGEMENT
# # ============================================================================
# class CreateOrUpdateDoctorProfileAPIView(APIView):
#     """
#     Doctors update onboarding details:
#     - specialization
#     - experience
#     - fee
#     - bio
#     """
#     permission_classes = [permissions.AllowAny]

#     def post(self, request, user_id):
#         profile = get_object_or_404(UserProfile, user_id=user_id)

#         if profile.role != "doctor":
#             return Response({"detail": "User is not a doctor"}, status=400)

#         doctor_profile, _ = DoctorProfile.objects.get_or_create(profile=profile)

#         serializer = DoctorProfileSerializer(
#             doctor_profile, data=request.data, partial=True
#         )
#         serializer.is_valid(raise_exception=True)
#         serializer.save()

#         return Response(serializer.data, status=200)


# # ============================================================================
# # DOCTOR DOCUMENT UPLOAD
# # ============================================================================
# class UploadDoctorDocumentAPIView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def post(self, request, user_id):
#         profile = get_object_or_404(UserProfile, user_id=user_id)

#         data = {**request.data, "profile": profile.id}
#         serializer = DoctorDocumentSerializer(data=data)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()

#         # In production → trigger Celery email to admin
#         # notify_admin_new_document.delay(profile.user_id)

#         return Response(serializer.data, status=201)


# # ============================================================================
# # DOCTOR AVAILABILITY CRUD
# # ============================================================================
# class AddAvailabilityAPIView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def post(self, request, user_id):
#         profile = get_object_or_404(UserProfile, user_id=user_id)
#         doctor_profile = get_object_or_404(DoctorProfile, profile=profile)

#         data = {**request.data, "profile": profile.id}
#         serializer = DoctorAvailabilitySerializer(data=data)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()

#         return Response(serializer.data, status=201)


# class DeleteAvailabilityAPIView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def delete(self, request, availability_id):
#         availability = get_object_or_404(DoctorAvailability, id=availability_id)
#         availability.delete()
#         return Response({"detail": "Deleted"}, status=200)


# # ============================================================================
# # ADMIN: DOCTOR APPROVAL
# # ============================================================================
# class ApproveDoctorAPIView(APIView):
#     permission_classes = [permissions.AllowAny]  # change to admin-only later

#     def post(self, request, user_id):
#         profile = get_object_or_404(UserProfile, user_id=user_id)
#         doctor_profile = get_object_or_404(DoctorProfile, profile=profile)

#         doctor_profile.doctor_status = "approved"
#         doctor_profile.save()

#         # Celery: send email
#         # send_doctor_status_email.delay(user_id, "approved")

#         return Response({"detail": "Doctor approved"}, status=200)


# class RejectDoctorAPIView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def post(self, request, user_id):
#         profile = get_object_or_404(UserProfile, user_id=user_id)
#         doctor_profile = get_object_or_404(DoctorProfile, profile=profile)

#         doctor_profile.doctor_status = "rejected"
#         doctor_profile.save()

#         # Celery email
#         # send_doctor_status_email.delay(user_id, "rejected")

#         return Response({"detail": "Doctor rejected"}, status=200)


# # ============================================================================
# # ADMIN DASHBOARD LISTING — USER MANAGEMENT TABLE
# # ============================================================================
# class UserManagementListAPIView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def get(self, request):
#         """
#         Filters:
#         ?search=
#         ?role=
#         ?status=
#         ?date_from=
#         ?date_to=
#         """
#         search = request.GET.get("search", "")
#         role = request.GET.get("role")
#         status_filter = request.GET.get("status")

#         q = UserProfile.objects.all()

#         if search:
#             q = q.filter(
#                 Q(name__icontains=search)
#                 | Q(email__icontains=search)
#                 | Q(user_id__icontains=search)
#             )

#         if role and role != "all":
#             q = q.filter(role=role)

#         # convert onboarding_status to active/pending for UI
#         if status_filter == "active":
#             q = q.filter(onboarding_status=100)
#         elif status_filter == "pending":
#             q = q.filter(onboarding_status__lt=100)

#         return Response(UserProfileSerializer(q, many=True).data)


# # ============================================================================
# # NOTIFICATIONS
# # ============================================================================
# class NotificationListAPIView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def get(self, request, user_id):
#         profile = get_object_or_404(UserProfile, user_id=user_id)
#         notifications = Notification.objects.filter(user_profile=profile)
#         return Response(NotificationSerializer(notifications, many=True).data)


# # ======================================================================
# # LIST DOCTOR DOCUMENTS
# # ======================================================================
# class ListDoctorDocumentsAPIView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def get(self, request, user_id):
#         profile = get_object_or_404(UserProfile, user_id=user_id)
#         docs = profile.documents.all()
#         serializer = DoctorDocumentSerializer(docs, many=True)
#         return Response(serializer.data)


# # ======================================================================
# # LIST DOCTOR AVAILABILITY
# # ======================================================================
# class ListAvailabilityAPIView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def get(self, request, user_id):
#         profile = get_object_or_404(UserProfile, user_id=user_id)
#         availability = profile.availability.all()
#         serializer = DoctorAvailabilitySerializer(availability, many=True)
#         return Response(serializer.data)

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

from .tasks import send_doctor_status_email
from .permissions import (
    IsAuthenticatedJWT,
    IsOwner,
    IsDoctor,
    IsAdmin,
)
from .authentication import JWTAuthentication


# =========================================================
# INTERNAL — PROFILE CREATE (AUTH SERVICE ONLY)
# =========================================================
class CreateProfileInternalAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = UserProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)


# =========================================================
# USER PROFILE
# =========================================================
class GetProfileAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsOwner]

    def get(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        self.check_object_permissions(request, profile)
        return Response(UserProfileSerializer(profile).data)


class UpdateProfileAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsOwner]

    def put(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
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

        doctor_profile, _ = DoctorProfile.objects.get_or_create(profile=profile)

        serializer = DoctorProfileSerializer(
            doctor_profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

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


class ListDoctorDocumentsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor, IsOwner]

    def get(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        self.check_object_permissions(request, profile)

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
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=201)


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
# PUBLIC — APPROVED DOCTORS LIST (🔥 REQUIRED)
# =========================================================
class PublicDoctorListAPIView(APIView):
    permission_classes = []  # PUBLIC

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
                "experience": d.experience,
                "consultation_fee": d.consultation_fee,
            })

        return Response(data)
