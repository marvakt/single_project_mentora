from django.contrib import admin

from .models import (
    DoctorAvailability,
    DoctorDocument,
    DoctorProfile,
    Notification,
    UserProfile,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user_id", "email", "role", "status", "onboarding_status")
    search_fields = ("email", "user_id")
    list_filter = ("role", "status")


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ("profile", "doctor_status", "specialization")
    list_filter = ("doctor_status",)


@admin.register(DoctorDocument)
class DoctorDocumentAdmin(admin.ModelAdmin):
    list_display = ("profile", "doc_type", "verified")


@admin.register(DoctorAvailability)
class DoctorAvailabilityAdmin(admin.ModelAdmin):
    list_display = ("profile", "day_of_week", "start_time", "end_time")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user_profile", "title", "sent", "created_at")
