# # profiles/serializers.py
# from rest_framework import serializers
# from .models import (
#     UserProfile,
#     DoctorProfile,
#     DoctorDocument,
#     DoctorAvailability,
#     Notification
# )


# # ============================================================
# # DOCTOR DOCUMENT SERIALIZER
# # ============================================================
# class DoctorDocumentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = DoctorDocument
#         fields = "__all__"
#         read_only_fields = ("uploaded_at", "verified")


# # ============================================================
# # DOCTOR AVAILABILITY SERIALIZER
# # ============================================================
# class DoctorAvailabilitySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = DoctorAvailability
#         fields = "__all__"
#         read_only_fields = ()


# # ============================================================
# # DOCTOR PROFILE SERIALIZER
# # ============================================================
# class DoctorProfileSerializer(serializers.ModelSerializer):
#     documents = DoctorDocumentSerializer(many=True, read_only=True)
#     availability = DoctorAvailabilitySerializer(many=True, read_only=True)
#     email = serializers.CharField(source="profile.email", read_only=True)
#     name = serializers.CharField(source="profile.name", read_only=True)

#     class Meta:
#         model = DoctorProfile
#         fields = [
#             "id",
#             "email",
#             "name",
#             "specialization",
#             "experience_years",
#             "consultation_fee",
#             "bio",
#             "doctor_status",
#             "registered_at",
#             "updated_at",
#             "documents",
#             "availability",
#         ]
#         read_only_fields = ("registered_at", "updated_at", "doctor_status")


# # ============================================================
# # USER PROFILE SERIALIZER
# # ============================================================
# class UserProfileSerializer(serializers.ModelSerializer):
#     documents = DoctorDocumentSerializer(many=True, read_only=True)
#     availability = DoctorAvailabilitySerializer(many=True, read_only=True)
#     doctor = DoctorProfileSerializer(read_only=True)

#     class Meta:
#         model = UserProfile
#         fields = "__all__"
#         read_only_fields = ("created_at", "updated_at", "last_activity")


# # ============================================================
# # NOTIFICATION SERIALIZER
# # ============================================================
# class NotificationSerializer(serializers.ModelSerializer):
#     email = serializers.CharField(source="user_profile.email", read_only=True)

#     class Meta:
#         model = Notification
#         fields = "__all__"
#         read_only_fields = ("created_at", "sent")



from rest_framework import serializers
from .models import (
    UserProfile,
    DoctorProfile,
    DoctorDocument,
    DoctorAvailability,
    Notification
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
# class UserProfileSerializer(serializers.ModelSerializer):
#     documents = DoctorDocumentSerializer(many=True, read_only=True)
#     availability = DoctorAvailabilitySerializer(many=True, read_only=True)
#     doctor = DoctorProfileSerializer(read_only=True)

#     class Meta:
#         model = UserProfile
#         fields = "__all__"
#         read_only_fields = (
#             "created_at",
#             "updated_at",
#             "last_activity",
#         )

#     # 🔥 FIX: allow internal profile creation with minimal fields
#     def create(self, validated_data):
#         validated_data.setdefault("name", "")
#         validated_data.setdefault("phone", "")
#         validated_data.setdefault("gender", "")
#         validated_data.setdefault("address", "")
#         validated_data.setdefault("avatar", "")
#         validated_data.setdefault("onboarding_status", 0)
#         validated_data.setdefault("status", "pending")

#         return super().create(validated_data)


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
# NOTIFICATION SERIALIZER
# ============================================================
class NotificationSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source="user_profile.email", read_only=True)

    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ("created_at", "sent")
