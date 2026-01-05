


# """
# appointments/urls.py - UPDATED URL CONFIGURATION

# Enhanced URL routing with all appointment endpoints.
# """
# from django.urls import path
# from .views import (
#     AppointmentAPIView,
#     AppointmentDetailAPIView,
#     AppointmentCancelAPIView,
#     AppointmentCompleteAPIView,
#     AvailableSlotsAPIView,
# )
# from .payment_views import (
#     PaymentCreateAPIView,
#     RazorpayWebhookAPIView,
# )
# from .video_views import (
#     VideoSessionCreateAPIView,
#     VideoSessionDetailAPIView,
# )

# urlpatterns = [
#     # Appointment management
#     path("", AppointmentAPIView.as_view(), name="appointment-list-create"),
#     path("<uuid:id>/", AppointmentDetailAPIView.as_view(), name="appointment-detail"),
#     path("<uuid:id>/cancel/", AppointmentCancelAPIView.as_view(), name="appointment-cancel"),
#     path("<uuid:id>/complete/", AppointmentCompleteAPIView.as_view(), name="appointment-complete"),
    
#     # Payment endpoints
#     path("<uuid:appointment_id>/payments/create/", PaymentCreateAPIView.as_view(), name="payment-create"),
    
#     # Video session endpoints
#     path("<uuid:appointment_id>/video/create/", VideoSessionCreateAPIView.as_view(), name="video-create"),
#     path("<uuid:appointment_id>/video/", VideoSessionDetailAPIView.as_view(), name="video-detail"),
    
#     # Available slots endpoint
#     path("doctors/<uuid:doctor_id>/available-slots/", AvailableSlotsAPIView.as_view(), name="available-slots"),
    
    
    
# ]


"""
appointments/urls.py - UPDATED URL CONFIGURATION

Enhanced URL routing with all appointment endpoints.
All views imported from single views.py file.
"""
from django.urls import path

from .views import (  # Appointment views; Payment views; Video session views
    AppointmentAPIView,
    AppointmentCancelAPIView,
    AppointmentCompleteAPIView,
    AppointmentDetailAPIView,
    AvailableSlotsAPIView,
    PaymentCreateAPIView,
    RazorpayWebhookAPIView,
    VideoSessionCreateAPIView,
    VideoSessionDetailAPIView,
)

urlpatterns = [
    # ==================== APPOINTMENT ENDPOINTS ====================
    
    # Create appointment & List appointments
    path("", AppointmentAPIView.as_view(), name="appointment-list-create"),
    
    # Get appointment details
    path("<uuid:id>/", AppointmentDetailAPIView.as_view(), name="appointment-detail"),
    
    # Cancel appointment
    path("<uuid:id>/cancel/", AppointmentCancelAPIView.as_view(), name="appointment-cancel"),
    
    # Complete appointment (doctor only)
    path("<uuid:id>/complete/", AppointmentCompleteAPIView.as_view(), name="appointment-complete"),
    
    
    # ==================== PAYMENT ENDPOINTS ====================
    
    # Create payment order
    path("<uuid:appointment_id>/payments/create/", PaymentCreateAPIView.as_view(), name="payment-create"),
    
    # Razorpay webhook (no auth required)
    path("payments/webhook/razorpay/", RazorpayWebhookAPIView.as_view(), name="razorpay-webhook"),
    
    
    # ==================== VIDEO SESSION ENDPOINTS ====================
    
    # Create video session
    path("<uuid:appointment_id>/video/create/", VideoSessionCreateAPIView.as_view(), name="video-create"),
    
    # Get & Update video session
    path("<uuid:appointment_id>/video/", VideoSessionDetailAPIView.as_view(), name="video-detail"),
    
    
    # ==================== UTILITY ENDPOINTS ====================
    
    # Get available slots for a doctor
    path("doctors/<uuid:doctor_id>/available-slots/", AvailableSlotsAPIView.as_view(), name="available-slots"),
]