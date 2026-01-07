


# # profiles/serializers.py
# from rest_framework import serializers
# from .models import (
#     UserProfile,
#     DoctorProfile,
#     DoctorDocument,
#     DoctorAvailability,
#     DoctorRating,
#     Notification,
#     MoodEntry
# )


# # ============================================================
# # DOCTOR DOCUMENT SERIALIZER
# # ============================================================
# class DoctorDocumentSerializer(serializers.ModelSerializer):
#     """Serializer for doctor document uploads."""
    
#     file_key = serializers.CharField(allow_null=True, required=False, read_only=True)
    
#     class Meta:
#         model = DoctorDocument
#         fields = [
#             'id',
#             'profile',
#             'doc_type',
#             'file_url',
#             'file_key',
#             'verified',
#             'uploaded_at'
#         ]
#         read_only_fields = ('uploaded_at', 'verified', 'file_key')

#     def validate_doc_type(self, value):
#         """Validate document type."""
#         allowed_types = ['license', 'degree', 'id_proof', 'certificate']
#         if value not in allowed_types:
#             raise serializers.ValidationError(
#                 f"Document type must be one of: {', '.join(allowed_types)}"
#             )
#         return value


# # ============================================================
# # DOCTOR AVAILABILITY SERIALIZER
# # ============================================================
# class DoctorAvailabilitySerializer(serializers.ModelSerializer):
#     """Serializer for doctor availability slots."""
    
#     class Meta:
#         model = DoctorAvailability
#         fields = [
#             'id',
#             'profile',
#             'day_of_week',
#             'start_time',
#             'end_time',
#             'timezone'
#         ]
#         read_only_fields = ('id',)
    
#     def validate_day_of_week(self, value):
#         """Validate day of week is within valid range."""
#         if value < 0 or value > 6:
#             raise serializers.ValidationError(
#                 "Day of week must be between 0 (Sunday) and 6 (Saturday)"
#             )
#         return value
    
#     def validate(self, data):
#         """Validate that start_time is before end_time."""
#         start_time = data.get('start_time')
#         end_time = data.get('end_time')
        
#         if start_time and end_time and start_time >= end_time:
#             raise serializers.ValidationError(
#                 {"end_time": "End time must be after start time"}
#             )
        
#         return data


# # ============================================================
# # DOCTOR PROFILE SERIALIZER
# # ============================================================
# class DoctorProfileSerializer(serializers.ModelSerializer):
#     """Serializer for doctor profile information."""
    
#     documents = DoctorDocumentSerializer(many=True, read_only=True)
#     availability = DoctorAvailabilitySerializer(many=True, read_only=True)
#     email = serializers.CharField(source="profile.email", read_only=True)
#     name = serializers.CharField(source="profile.name", read_only=True)
#     average_rating = serializers.SerializerMethodField()
#     total_ratings = serializers.SerializerMethodField()

#     class Meta:
#         model = DoctorProfile
#         fields = [
#             'id',
#             'email',
#             'name',
#             'specialization',
#             'experience_years',
#             'consultation_fee',
#             'bio',
#             'doctor_status',
#             'registered_at',
#             'updated_at',
#             'documents',
#             'availability',
#             'average_rating',
#             'total_ratings',
#         ]
#         read_only_fields = (
#             'id',
#             'registered_at',
#             'updated_at',
#             'doctor_status',
#             'average_rating',
#             'total_ratings'
#         )
    
#     def get_average_rating(self, obj):
#         """Get average rating for the doctor."""
#         return round(obj.average_rating, 1) if obj.average_rating else 0.0
    
#     def get_total_ratings(self, obj):
#         """Get total number of ratings for the doctor."""
#         return obj.total_ratings
    
#     def validate_experience_years(self, value):
#         """Validate experience years is non-negative."""
#         if value < 0:
#             raise serializers.ValidationError("Experience years cannot be negative")
#         return value
    
#     def validate_consultation_fee(self, value):
#         """Validate consultation fee is positive."""
#         if value < 0:
#             raise serializers.ValidationError("Consultation fee cannot be negative")
#         return value


# # ============================================================
# # USER PROFILE SERIALIZER
# # ============================================================
# class UserProfileSerializer(serializers.ModelSerializer):
#     """Serializer for user profile information."""
    
#     documents = DoctorDocumentSerializer(many=True, read_only=True)
#     availability = DoctorAvailabilitySerializer(many=True, read_only=True)
#     doctor = DoctorProfileSerializer(read_only=True)
    
#     email = serializers.EmailField(read_only=True)
#     role = serializers.CharField(read_only=True)
#     user_id = serializers.IntegerField(read_only=True)

#     class Meta:
#         model = UserProfile
#         fields = [
#             'id',
#             'user_id',
#             'email',
#             'role',
#             'name',
#             'phone',
#             'avatar',
#             'gender',
#             'address',
#             'status',
#             'onboarding_status',
#             'last_activity',
#             'receive_mood_notifications',
#             'created_at',
#             'updated_at',
#             'documents',
#             'availability',
#             'doctor'
#         ]
#         read_only_fields = (
#             'id',
#             'user_id',
#             'email',
#             'role',
#             'created_at',
#             'updated_at',
#             'last_activity',
#         )

#     def validate_phone(self, value):
#         """Validate phone number format."""
#         if value and not value.replace('+', '').replace('-', '').replace(' ', '').isdigit():
#             raise serializers.ValidationError("Invalid phone number format")
#         return value
    
#     def validate_gender(self, value):
#         """Validate gender value."""
#         if value:
#             allowed_genders = ['male', 'female', 'other', 'prefer_not_to_say']
#             if value.lower() not in allowed_genders:
#                 raise serializers.ValidationError(
#                     f"Gender must be one of: {', '.join(allowed_genders)}"
#                 )
#         return value


# # ============================================================
# # DOCTOR RATING SERIALIZER
# # ============================================================
# class DoctorRatingSerializer(serializers.ModelSerializer):
#     """Serializer for doctor ratings and reviews."""
    
#     user_email = serializers.CharField(source="user.email", read_only=True)
#     doctor_email = serializers.CharField(source="doctor.email", read_only=True)
#     user_name = serializers.CharField(source="user.name", read_only=True)
#     doctor_name = serializers.CharField(source="doctor.name", read_only=True)
    
#     class Meta:
#         model = DoctorRating
#         fields = [
#             'id',
#             'doctor',
#             'user',
#             'rating',
#             'review',
#             'created_at',
#             'updated_at',
#             'user_email',
#             'doctor_email',
#             'user_name',
#             'doctor_name',
#         ]
#         read_only_fields = (
#             'id',
#             'created_at',
#             'updated_at',
#             'user_email',
#             'doctor_email',
#             'user_name',
#             'doctor_name'
#         )
    
#     def validate_rating(self, value):
#         """Validate rating is between 1 and 5."""
#         if value < 1 or value > 5:
#             raise serializers.ValidationError("Rating must be between 1 and 5")
#         return value
    
#     def validate(self, data):
#         """Validate that user is not rating themselves."""
#         user = data.get('user')
#         doctor = data.get('doctor')
        
#         if user and doctor and user.user_id == doctor.user_id:
#             raise serializers.ValidationError(
#                 {"rating": "You cannot rate yourself"}
#             )
        
#         return data


# # ============================================================
# # MOOD ENTRY SERIALIZER
# # ============================================================
# class MoodEntrySerializer(serializers.ModelSerializer):
#     """Serializer for user mood tracking entries."""
    
#     user_email = serializers.CharField(source="user_profile.email", read_only=True)
#     user_name = serializers.CharField(source="user_profile.name", read_only=True)
    
#     class Meta:
#         model = MoodEntry
#         fields = [
#             'id',
#             'user_profile',
#             'mood_score',
#             'anxiety_level',
#             'energy_level',
#             'sleep_hours',
#             'notes',
#             'created_at',
#             'user_email',
#             'user_name'
#         ]
#         read_only_fields = ('id', 'created_at', 'user_email', 'user_name')
    
#     def validate_mood_score(self, value):
#         """Validate mood score is between 1 and 10."""
#         if value < 1 or value > 10:
#             raise serializers.ValidationError("Mood score must be between 1 and 10")
#         return value
    
#     def validate_anxiety_level(self, value):
#         """Validate anxiety level is between 1 and 10."""
#         if value < 1 or value > 10:
#             raise serializers.ValidationError("Anxiety level must be between 1 and 10")
#         return value
    
#     def validate_energy_level(self, value):
#         """Validate energy level is between 1 and 10."""
#         if value < 1 or value > 10:
#             raise serializers.ValidationError("Energy level must be between 1 and 10")
#         return value
    
#     def validate_sleep_hours(self, value):
#         """Validate sleep hours is reasonable."""
#         if value < 0 or value > 24:
#             raise serializers.ValidationError("Sleep hours must be between 0 and 24")
#         return value


# # ============================================================
# # NOTIFICATION SERIALIZER
# # ============================================================
# class NotificationSerializer(serializers.ModelSerializer):
#     """Serializer for user notifications."""
    
#     email = serializers.CharField(source="user_profile.email", read_only=True)
#     user_name = serializers.CharField(source="user_profile.name", read_only=True)

#     class Meta:
#         model = Notification
#         fields = [
#             'id',
#             'user_profile',
#             'title',
#             'message',
#             'sent',
#             'created_at',
#             'email',
#             'user_name'
#         ]
#         read_only_fields = ('id', 'created_at', 'sent', 'email', 'user_name')
    
#     def validate_title(self, value):
#         """Validate title is not empty."""
#         if not value or not value.strip():
#             raise serializers.ValidationError("Title cannot be empty")
#         return value
    
#     def validate_message(self, value):
#         """Validate message is not empty."""
#         if not value or not value.strip():
#             raise serializers.ValidationError("Message cannot be empty")
#         return value


# # ============================================================
# # DOCTOR SUGGESTION RESPONSE SERIALIZER
# # ============================================================
# class DoctorSuggestionSerializer(serializers.Serializer):
#     """Serializer for doctor suggestion response."""
    
#     user_id = serializers.IntegerField()
#     name = serializers.CharField()
#     email = serializers.EmailField()
#     specialization = serializers.CharField()
#     experience_years = serializers.IntegerField()
#     consultation_fee = serializers.IntegerField()
#     average_rating = serializers.FloatField()
#     total_ratings = serializers.IntegerField()
#     match_score = serializers.FloatField()



# profiles/serializers.py
from rest_framework import serializers

from .models import (
    DoctorAvailability,
    DoctorDocument,
    DoctorProfile,
    DoctorRating,
    MoodEntry,
    Notification,
    UserProfile,
)


# ============================================================
# DOCTOR DOCUMENT SERIALIZER
# ============================================================
class DoctorDocumentSerializer(serializers.ModelSerializer):
    """Serializer for doctor document uploads."""
    
    file_key = serializers.CharField(allow_null=True, required=False, read_only=True)
    
    class Meta:
        model = DoctorDocument
        fields = [
            'id',
            'profile',
            'doc_type',
            'file_url',
            'file_key',
            'verified',
            'uploaded_at'
        ]
        read_only_fields = ('uploaded_at', 'verified', 'file_key')

    def validate_doc_type(self, value):
        """Validate document type."""
        allowed_types = ['license', 'degree', 'id_proof', 'certificate']
        if value not in allowed_types:
            raise serializers.ValidationError(
                f"Document type must be one of: {', '.join(allowed_types)}"
            )
        return value


# ============================================================
# DOCTOR AVAILABILITY SERIALIZER
# ============================================================
class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for doctor availability slots."""
    
    # Aliases for frontend compatibility
    slot_duration_minutes = serializers.IntegerField(source='slot_duration', write_only=True, required=False)
    max_patients_per_slot = serializers.IntegerField(source='max_patients', write_only=True, required=False)
    
    class Meta:
        model = DoctorAvailability
        fields = [
            'id',
            'profile',
            'day_of_week',
            'start_time',
            'end_time',
            'slot_duration',
            'slot_duration_minutes',
            'max_patients',
            'max_patients_per_slot',
            'timezone'
        ]
        read_only_fields = ('id',)
    
    def validate_day_of_week(self, value):
        """Validate day of week is within valid range."""
        if value < 0 or value > 6:
            raise serializers.ValidationError(
                "Day of week must be between 0 (Sunday) and 6 (Saturday)"
            )
        return value
    
    def validate(self, data):
        """Validate that start_time is before end_time."""
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time"}
            )
        
        return data


# ============================================================
# DOCTOR PROFILE SERIALIZER
# ============================================================
class DoctorProfileSerializer(serializers.ModelSerializer):
    """Serializer for doctor profile information."""
    
    documents = DoctorDocumentSerializer(many=True, read_only=True)
    availability = DoctorAvailabilitySerializer(many=True, read_only=True)
    email = serializers.CharField(source="profile.email", read_only=True)
    name = serializers.CharField(source="profile.name", read_only=True)
    average_rating = serializers.SerializerMethodField()
    total_ratings = serializers.SerializerMethodField()

    class Meta:
        model = DoctorProfile
        fields = [
            'id',
            'email',
            'name',
            'specialization',
            'experience_years',
            'consultation_fee',
            'bio',
            'doctor_status',
            'registered_at',
            'updated_at',
            'documents',
            'availability',
            'average_rating',
            'total_ratings',
        ]
        read_only_fields = (
            'id',
            'registered_at',
            'updated_at',
            'doctor_status',
            'average_rating',
            'total_ratings'
        )
    
    def get_average_rating(self, obj):
        """Get average rating for the doctor."""
        return round(obj.average_rating, 1) if obj.average_rating else 0.0
    
    def get_total_ratings(self, obj):
        """Get total number of ratings for the doctor."""
        return obj.total_ratings
    
    def validate_experience_years(self, value):
        """Validate experience years is non-negative."""
        if value < 0:
            raise serializers.ValidationError("Experience years cannot be negative")
        return value
    
    def validate_consultation_fee(self, value):
        """Validate consultation fee is positive."""
        if value < 0:
            raise serializers.ValidationError("Consultation fee cannot be negative")
        return value


# ============================================================
# USER PROFILE SERIALIZER
# ============================================================
class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information."""
    
    documents = DoctorDocumentSerializer(many=True, read_only=True)
    availability = DoctorAvailabilitySerializer(many=True, read_only=True)
    doctor = DoctorProfileSerializer(read_only=True)
    
    email = serializers.EmailField(read_only=True)
    role = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'user_id',
            'email',
            'role',
            'name',
            'phone',
            'avatar',
            'gender',
            'address',
            'status',
            'onboarding_status',
            'last_activity',
            'receive_mood_notifications',
            'fcm_token',
            'created_at',
            'updated_at',
            'documents',
            'availability',
            'doctor'
        ]
        read_only_fields = (
            'id',
            'user_id',
            'email',
            'role',
            'created_at',
            'updated_at',
            'last_activity',
        )

    def validate_phone(self, value):
        """Validate phone number format."""
        if value and not value.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise serializers.ValidationError("Invalid phone number format")
        return value
    
    def validate_gender(self, value):
        """Validate gender value."""
        if value:
            allowed_genders = ['male', 'female', 'other', 'prefer_not_to_say']
            if value.lower() not in allowed_genders:
                raise serializers.ValidationError(
                    f"Gender must be one of: {', '.join(allowed_genders)}"
                )
        return value


# ============================================================
# DOCTOR RATING SERIALIZER
# ============================================================
class DoctorRatingSerializer(serializers.ModelSerializer):
    """Serializer for doctor ratings and reviews."""
    
    user_email = serializers.CharField(source="user.email", read_only=True)
    doctor_email = serializers.CharField(source="doctor.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.name", read_only=True)
    
    class Meta:
        model = DoctorRating
        fields = [
            'id',
            'doctor',
            'user',
            'rating',
            'review',
            'created_at',
            'updated_at',
            'user_email',
            'doctor_email',
            'user_name',
            'doctor_name',
        ]
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
            'user_email',
            'doctor_email',
            'user_name',
            'doctor_name'
        )
    
    def validate_rating(self, value):
        """Validate rating is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate(self, data):
        """Validate that user is not rating themselves."""
        user = data.get('user')
        doctor = data.get('doctor')
        
        if user and doctor and user.user_id == doctor.user_id:
            raise serializers.ValidationError(
                {"rating": "You cannot rate yourself"}
            )
        
        return data


# ============================================================
# MOOD ENTRY SERIALIZER
# ============================================================
class MoodEntrySerializer(serializers.ModelSerializer):
    """Serializer for user mood tracking entries."""
    
    user_email = serializers.CharField(source="user_profile.email", read_only=True)
    user_name = serializers.CharField(source="user_profile.name", read_only=True)
    
    class Meta:
        model = MoodEntry
        fields = [
            'id',
            'user_profile',
            'mood_score',
            'anxiety_level',
            'energy_level',
            'sleep_hours',
            'notes',
            'created_at',
            'user_email',
            'user_name'
        ]
        read_only_fields = ('id', 'created_at', 'user_email', 'user_name')
    
    def validate_mood_score(self, value):
        """Validate mood score is between 1 and 10."""
        if value < 1 or value > 10:
            raise serializers.ValidationError("Mood score must be between 1 and 10")
        return value
    
    def validate_anxiety_level(self, value):
        """Validate anxiety level is between 1 and 10."""
        if value < 1 or value > 10:
            raise serializers.ValidationError("Anxiety level must be between 1 and 10")
        return value
    
    def validate_energy_level(self, value):
        """Validate energy level is between 1 and 10."""
        if value < 1 or value > 10:
            raise serializers.ValidationError("Energy level must be between 1 and 10")
        return value
    
    def validate_sleep_hours(self, value):
        """Validate sleep hours is reasonable."""
        if value < 0 or value > 24:
            raise serializers.ValidationError("Sleep hours must be between 0 and 24")
        return value


# ============================================================
# NOTIFICATION SERIALIZER
# ============================================================
class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications."""
    
    email = serializers.CharField(source="user_profile.email", read_only=True)
    user_name = serializers.CharField(source="user_profile.name", read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'user_profile',
            'title',
            'message',
            'sent',
            'created_at',
            'email',
            'user_name'
        ]
        read_only_fields = ('id', 'created_at', 'sent', 'email', 'user_name')
    
    def validate_title(self, value):
        """Validate title is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        return value
    
    def validate_message(self, value):
        """Validate message is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Message cannot be empty")
        return value


# ============================================================
# DOCTOR SUGGESTION RESPONSE SERIALIZER
# ============================================================
class DoctorSuggestionSerializer(serializers.Serializer):
    """Serializer for doctor suggestion response."""
    
    user_id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()
    specialization = serializers.CharField()
    experience_years = serializers.IntegerField()
    consultation_fee = serializers.IntegerField()
    average_rating = serializers.FloatField()
    total_ratings = serializers.IntegerField()
    match_score = serializers.FloatField()