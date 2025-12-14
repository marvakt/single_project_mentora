# profiles/urls.py
from django.urls import path
from .views import (
    # Internal
    CreateProfileInternalAPIView,

    # Profile
    GetProfileAPIView,
    UpdateProfileAPIView,

    # Doctor Profile
    CreateOrUpdateDoctorProfileAPIView,

    # Documents
    UploadDoctorDocumentAPIView,

    # Availability
    AddAvailabilityAPIView,
    DeleteAvailabilityAPIView,

    # Admin approval
    ApproveDoctorAPIView,
    RejectDoctorAPIView,

    # Listings
    UserManagementListAPIView,

    # Notifications
    NotificationListAPIView,


    ListAvailabilityAPIView,

    ListDoctorDocumentsAPIView,


    PublicDoctorListAPIView
)

urlpatterns = [
    # ---------- INTERNAL ----------
    path("internal/profile/create/", CreateProfileInternalAPIView.as_view(), name="internal-create-profile"),

    # ---------- USER PROFILE ----------
    path("profile/<int:user_id>/", GetProfileAPIView.as_view(), name="get-profile"),
    path("profile/<int:user_id>/update/", UpdateProfileAPIView.as_view(), name="update-profile"),

    # ---------- DOCTOR PROFILE ----------
    path("doctor/<int:user_id>/profile/", CreateOrUpdateDoctorProfileAPIView.as_view(), name="doctor-profile"),

    # ---------- DOCTOR DOCUMENTS ----------
    path("doctor/<int:user_id>/document/upload/", UploadDoctorDocumentAPIView.as_view(), name="upload-doctor-document"),

    # ---------- DOCTOR AVAILABILITY ----------
    path("doctor/<int:user_id>/availability/add/", AddAvailabilityAPIView.as_view(), name="add-availability"),
    path("doctor/availability/<int:availability_id>/delete/", DeleteAvailabilityAPIView.as_view(), name="delete-availability"),

    # ---------- DOCTOR APPROVAL ----------
    path("doctor/<int:user_id>/approve/", ApproveDoctorAPIView.as_view(), name="approve-doctor"),
    path("doctor/<int:user_id>/reject/", RejectDoctorAPIView.as_view(), name="reject-doctor"),

    # ---------- ADMIN USER LIST ----------
    path("admin/users/", UserManagementListAPIView.as_view(), name="admin-user-list"),

    # ---------- NOTIFICATIONS ----------
    path("notifications/<int:user_id>/", NotificationListAPIView.as_view(), name="user-notifications"),

    path("doctor/<int:user_id>/documents/", ListDoctorDocumentsAPIView.as_view(), name="list-doctor-documents"),
    path("doctor/<int:user_id>/availability/", ListAvailabilityAPIView.as_view(), name="list-availability"),

   path("doctors/", PublicDoctorListAPIView.as_view(), name="public-doctor-list"),




]
