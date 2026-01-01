# profiles/serializers.py

from rest_framework import serializers
from .models import (
    UserProfile,
    DoctorProfile,
    DoctorDocument,
    DoctorAvailability,
    DoctorRating,
    Notification,
    MoodEntry
)

# ============================================================
# DOCTOR DOCUMENT SERIALIZER
# ============================================================
class DoctorDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorDocument
        fields = "__all__"
        read_only_fields = ("uploaded_at", "verified")


# ============================================================
# DOCTOR AVAILABILITY SERIALIZER
# ============================================================
class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorAvailability
        fields = "__all__"
        read_only_fields = ()
    
    def validate_day_of_week(self, value):
        if value < 0 or value > 6:
            raise serializers.ValidationError("Day of week must be between 0 (Sunday) and 6 (Saturday)")
        return value
    
    def validate(self, data):
        # Ensure start_time is before end_time
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time")
        
        return data


# ============================================================
# DOCTOR PROFILE SERIALIZER
# ============================================================
class DoctorProfileSerializer(serializers.ModelSerializer):
    documents = DoctorDocumentSerializer(many=True, read_only=True)
    availability = DoctorAvailabilitySerializer(many=True, read_only=True)
    email = serializers.CharField(source="profile.email", read_only=True)
    name = serializers.CharField(source="profile.name", read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            "id",
            "email",
            "name",
            "specialization",
            "experience_years",
            "consultation_fee",
            "bio",
            "doctor_status",
            "registered_at",
            "updated_at",
            "documents",
            "availability",
        ]
        read_only_fields = ("registered_at", "updated_at", "doctor_status")


# ============================================================
# USER PROFILE SERIALIZER   (FIXED!)
# ============================================================
class UserProfileSerializer(serializers.ModelSerializer):
    documents = DoctorDocumentSerializer(many=True, read_only=True)
    availability = DoctorAvailabilitySerializer(many=True, read_only=True)
    doctor = DoctorProfileSerializer(read_only=True)

    email = serializers.EmailField(read_only=True)
    role = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserProfile
        fields = "__all__"
        read_only_fields = (
            "user_id",
            "email",
            "role",
            "created_at",
            "updated_at",
            "last_activity",
        )

    def create(self, validated_data):
        validated_data.setdefault("name", "")
        validated_data.setdefault("phone", "")
        validated_data.setdefault("gender", "")
        validated_data.setdefault("address", "")
        validated_data.setdefault("avatar", "")
        validated_data.setdefault("onboarding_status", 0)
        validated_data.setdefault("status", "pending")
        return super().create(validated_data)


# ============================================================
# DOCTOR RATING SERIALIZER
# ============================================================
class DoctorRatingSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    doctor_email = serializers.CharField(source="doctor.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    
    class Meta:
        model = DoctorRating
        fields = [
            "id",
            "doctor",
            "user",
            "rating",
            "review",
            "created_at",
            "updated_at",
            "user_email",
            "doctor_email",
            "user_name",
        ]
        read_only_fields = ("created_at", "updated_at", "user_email", "doctor_email", "user_name")


# ============================================================
# DOCTOR PROFILE WITH RATING SERIALIZER
# ============================================================
class DoctorProfileWithRatingSerializer(serializers.ModelSerializer):
    documents = DoctorDocumentSerializer(many=True, read_only=True)
    availability = DoctorAvailabilitySerializer(many=True, read_only=True)
    email = serializers.CharField(source="profile.email", read_only=True)
    name = serializers.CharField(source="profile.name", read_only=True)
    average_rating = serializers.SerializerMethodField()
    total_ratings = serializers.SerializerMethodField()
    
    class Meta:
        model = DoctorProfile
        fields = [
            "id",
            "email",
            "name",
            "specialization",
            "experience_years",
            "consultation_fee",
            "bio",
            "doctor_status",
            "registered_at",
            "updated_at",
            "documents",
            "availability",
            "average_rating",
            "total_ratings",
        ]
        read_only_fields = ("registered_at", "updated_at", "doctor_status", "average_rating", "total_ratings")
    
    def get_average_rating(self, obj):
        return round(obj.average_rating, 1) if obj.average_rating else 0.0
    
    def get_total_ratings(self, obj):
        return obj.total_ratings


# ============================================================
# MOOD ENTRY SERIALIZER
# ============================================================
class MoodEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodEntry
        fields = ["id", "mood_score", "anxiety_level", "energy_level", "sleep_hours", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


# ============================================================
# NOTIFICATION SERIALIZER
# ============================================================
class NotificationSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source="user_profile.email", read_only=True)

    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ("created_at", "sent")