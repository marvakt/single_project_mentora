# profiles/urls.py
from django.urls import path
from .views import (
    # Internal
    CreateProfileInternalAPIView,
    DoctorAvailabilityInternalAPIView,

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
    DeleteUserAPIView,

    # Notifications
    NotificationListAPIView,


    ListAvailabilityAPIView,

    ListDoctorDocumentsAPIView,
    GetDoctorDocumentAPIView,


    PublicDoctorListAPIView,
    
    # Ratings and Suggestions
    RateDoctorAPIView,
    DoctorSuggestionAPIView,
    
    # Mood Tracking
    SubmitMoodEntryAPIView,
    GetMoodHistoryAPIView,
    GetMoodTrendsAPIView,
)

# Import mood aggregation views
from .views.mood_aggregation import (
    DoctorMoodDashboardAPIView,
    PatientMoodHistoryAPIView,
)

urlpatterns = [
    # ---------- INTERNAL ----------
    path("internal/profile/create/", CreateProfileInternalAPIView.as_view(), name="internal-create-profile"),
    path("internal/doctors/<str:doctor_id>/availability/", DoctorAvailabilityInternalAPIView.as_view(), name="internal-doctor-availability"),

    # ---------- USER PROFILE ----------
    path("profile/<str:user_id>/", GetProfileAPIView.as_view(), name="get-profile"),
    path("profile/<str:user_id>/update/", UpdateProfileAPIView.as_view(), name="update-profile"),

    # ---------- DOCTOR PROFILE ----------
    path("doctor/<str:user_id>/profile/", CreateOrUpdateDoctorProfileAPIView.as_view(), name="doctor-profile"),

    # ---------- DOCTOR DOCUMENTS ----------
    path("doctor/<str:user_id>/document/upload/", UploadDoctorDocumentAPIView.as_view(), name="upload-doctor-document"),

    # ---------- DOCTOR AVAILABILITY ----------
    path("doctor/<str:user_id>/availability/add/", AddAvailabilityAPIView.as_view(), name="add-availability"),
    path("doctor/availability/<int:availability_id>/delete/", DeleteAvailabilityAPIView.as_view(), name="delete-availability"),

    # ---------- DOCTOR APPROVAL ----------
    path("doctor/<str:user_id>/approve/", ApproveDoctorAPIView.as_view(), name="approve-doctor"),
    path("doctor/<str:user_id>/reject/", RejectDoctorAPIView.as_view(), name="reject-doctor"),

    # ---------- ADMIN USER LIST ----------
    path("admin/users/", UserManagementListAPIView.as_view(), name="admin-user-list"),
    path("admin/users/<str:user_id>/delete/", DeleteUserAPIView.as_view(), name="delete-user"),

    # ---------- NOTIFICATIONS ----------
    path("notifications/<str:user_id>/", NotificationListAPIView.as_view(), name="user-notifications"),

    path("doctor/<str:user_id>/documents/", ListDoctorDocumentsAPIView.as_view(), name="list-doctor-documents"),
    path("doctor/document/<int:document_id>/", GetDoctorDocumentAPIView.as_view(), name="get-doctor-document"),
    path("doctor/<str:user_id>/availability/", ListAvailabilityAPIView.as_view(), name="list-availability"),

   path("doctors/", PublicDoctorListAPIView.as_view(), name="public-doctor-list"),
   
   # Ratings and Suggestions
   path("doctor/<str:doctor_id>/rate/", RateDoctorAPIView.as_view(), name="rate-doctor"),
   path("doctors/suggest/", DoctorSuggestionAPIView.as_view(), name="suggest-doctors"),
   
   # Mood Tracking
   path("mood-entries/", SubmitMoodEntryAPIView.as_view(), name="submit-mood-entry"),
   path("mood-entries/<str:user_id>/history/", GetMoodHistoryAPIView.as_view(), name="get-mood-history"),
   path("mood-entries/<str:user_id>/trends/", GetMoodTrendsAPIView.as_view(), name="get-mood-trends"),
   
   # Mood aggregation for doctors
   path("doctor/mood-dashboard/", DoctorMoodDashboardAPIView.as_view(), name="doctor-mood-dashboard"),
   path("doctor/patient-mood/<int:patient_user_id>/", PatientMoodHistoryAPIView.as_view(), name="patient-mood-history"),
]