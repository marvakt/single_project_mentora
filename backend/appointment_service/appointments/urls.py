"""
URL configuration for appointment_service V1.

Endpoints:
- POST /appointments - Create appointment
- GET /appointments - List appointments (role-based)
- POST /appointments/{id}/cancel - Cancel appointment
- POST /appointments/{id}/payments/create - Create payment order
"""
from django.urls import path
from .views import (
    AppointmentAPIView,
    AppointmentCancelAPIView,
)
from .payment_views import (
    PaymentCreateAPIView,
    RazorpayWebhookAPIView,
)

urlpatterns = [
    path("<uuid:id>/cancel/", AppointmentCancelAPIView.as_view(), name="appointment-cancel"),
    path("<uuid:appointment_id>/payments/create/", PaymentCreateAPIView.as_view(), name="payment-create"),
    path("", AppointmentAPIView.as_view(), name="appointment-list-create"),
]
