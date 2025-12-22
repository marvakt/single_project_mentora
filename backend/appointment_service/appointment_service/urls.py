"""
URL configuration for appointment_service project.
"""
from django.contrib import admin
from django.urls import path, include
from appointments.payment_views import RazorpayWebhookAPIView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/appointments/", include("appointments.urls")),
    path("payments/webhook/razorpay/", RazorpayWebhookAPIView.as_view(), name="razorpay-webhook"),
]
