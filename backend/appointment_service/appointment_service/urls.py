"""
URL configuration for appointment_service project.
"""
from appointments.views import RazorpayWebhookAPIView
from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

# Schema view for Swagger
schema_view = get_schema_view(
    openapi.Info(
        title="Appointment Service API",
        default_version='v1',
        description="API for appointment booking, payment processing, and video consultations",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@appointment.local"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/appointments/", include("appointments.urls")),
    path("payments/webhook/razorpay/", RazorpayWebhookAPIView.as_view(), name="razorpay-webhook"),
    
    # Swagger documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]
