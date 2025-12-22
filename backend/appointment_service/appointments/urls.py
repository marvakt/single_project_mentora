# """
# URL configuration for appointment_service V1.

# Endpoints:
# - POST /appointments - Create appointment
# - GET /appointments - List appointments (role-based)
# - POST /appointments/{id}/cancel - Cancel appointment
# - POST /appointments/{id}/payments/create - Create payment order
# """
# from django.urls import path
# from .views import (
#     AppointmentAPIView,
#     AppointmentCancelAPIView,
# )
# from .payment_views import (
#     PaymentCreateAPIView,
#     RazorpayWebhookAPIView,
# )

# urlpatterns = [
#     path("<uuid:id>/cancel/", AppointmentCancelAPIView.as_view(), name="appointment-cancel"),
#     path("<uuid:appointment_id>/payments/create/", PaymentCreateAPIView.as_view(), name="payment-create"),
#     path("", AppointmentAPIView.as_view(), name="appointment-list-create"),
# ]


"""
appointments/urls.py - UPDATED URL CONFIGURATION

Enhanced URL routing with all appointment endpoints.
"""
from django.urls import path
from .views import (
    AppointmentAPIView,
    AppointmentDetailAPIView,
    AppointmentCancelAPIView,
    AppointmentCompleteAPIView,
)
from .payment_views import (
    PaymentCreateAPIView,
    RazorpayWebhookAPIView,
)
from .video_views import (
    VideoSessionCreateAPIView,
    VideoSessionDetailAPIView,
)

urlpatterns = [
    # Appointment management
    path("", AppointmentAPIView.as_view(), name="appointment-list-create"),
    path("<uuid:id>/", AppointmentDetailAPIView.as_view(), name="appointment-detail"),
    path("<uuid:id>/cancel/", AppointmentCancelAPIView.as_view(), name="appointment-cancel"),
    path("<uuid:id>/complete/", AppointmentCompleteAPIView.as_view(), name="appointment-complete"),
    
    # Payment endpoints
    path("<uuid:appointment_id>/payments/create/", PaymentCreateAPIView.as_view(), name="payment-create"),
    
    # Video session endpoints
    path("<uuid:appointment_id>/video/create/", VideoSessionCreateAPIView.as_view(), name="video-create"),
    path("<uuid:appointment_id>/video/", VideoSessionDetailAPIView.as_view(), name="video-detail"),
    
    
    
]