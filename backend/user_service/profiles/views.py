


# profiles/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from datetime import timedelta
from django.utils import timezone

from .models import (
    UserProfile,
    DoctorProfile,
    DoctorDocument,
    DoctorAvailability,
    DoctorRating,
    Notification,
    MoodEntry,
)

from .serializers import (
    UserProfileSerializer,
    DoctorProfileSerializer,
    DoctorDocumentSerializer,
    DoctorAvailabilitySerializer,
    DoctorRatingSerializer,
    NotificationSerializer,
    MoodEntrySerializer,
)

from .tasks import send_doctor_status_email, notify_admin_new_doctor
from .permissions import (
    IsAuthenticatedJWT,
    IsOwner,
    IsDoctor,
    IsAdmin,
    IsInternalService,
    IsAuthenticatedJWTOrInternalService,
)
from .authentication import JWTAuthentication

from .utils import (
    convert_to_integer_id,
    check_profile_access_permission,
    check_document_access_permission,
    upload_file_to_s3,
    generate_presigned_url,
    check_doctor_profile_completion,
    update_onboarding_status,
    should_notify_admin,
    auto_approve_doctor_if_enabled,
    check_doctor_availability,
    calculate_severity_level,
    get_doctors_by_severity,
    get_top_matched_doctors,
    calculate_mood_trend,
    calculate_average_mood_metrics,
    format_mood_entry_data,
    calculate_patient_mood_statistics,
    filter_users_by_search_and_role,
    validate_severity_score,
    validate_rating,
    publish_mood_event,
)


# =========================================================
# INTERNAL — PROFILE CREATE (AUTH SERVICE ONLY)
# =========================================================
class CreateProfileInternalAPIView(APIView):
    authentication_classes = []
    permission_classes = [IsInternalService]

    def post(self, request):
        user_id = request.data.get("user_id")
        email = request.data.get("email")
        role = request.data.get("role", "user")

        if not user_id or not email:
            return Response(
                {"detail": "user_id and email required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile, created = UserProfile.objects.get_or_create(
            user_id=user_id,
            defaults={"email": email, "role": role, "status": "active"}
        )

        return Response(
            UserProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


# =========================================================
# INTERNAL — DOCTOR AVAILABILITY (FOR APPOINTMENT SERVICE)
# =========================================================
class DoctorAvailabilityInternalAPIView(APIView):
    authentication_classes = []
    permission_classes = [IsInternalService]

    def get(self, request, doctor_id):
        """
        Internal endpoint for appointment service to check doctor availability.
        Returns doctor status and consultation fee for booking decisions.
        """
        actual_doctor_id = convert_to_integer_id(doctor_id)
        profile = get_object_or_404(UserProfile, user_id=actual_doctor_id)
        
        availability_data = check_doctor_availability(profile)
        availability_data['doctor_id'] = doctor_id
        
        return Response(availability_data)


# =========================================================
# USER PROFILE
# =========================================================
class GetProfileAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        profile = get_object_or_404(
            UserProfile.objects.select_related('doctor'), 
            user_id=actual_user_id
        )
        
        requesting_user_id = request.user_data["user_id"]
        has_permission, is_own_profile, error_message = check_profile_access_permission(
            requesting_user_id, profile
        )
        
        if not has_permission:
            return Response(
                {"detail": error_message},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Apply ownership check for own profiles
        if is_own_profile:
            self.check_object_permissions(request, profile)
        
        return Response(UserProfileSerializer(profile).data)


class UpdateProfileAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsOwner]

    def put(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        
        # Check ownership
        if request.user_data["user_id"] != profile.user_id:
            return Response(
                {
                    "detail": f"Access denied. You can only update your own profile. "
                    f"Requested user_id: {user_id}, Your user_id: {request.user_data['user_id']}"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.check_object_permissions(request, profile)
        
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)


# =========================================================
# DOCTOR PROFILE (DOCTOR ONLY)
# =========================================================
class CreateOrUpdateDoctorProfileAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor, IsOwner]

    def post(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        self.check_object_permissions(request, profile)

        doctor_profile, created = DoctorProfile.objects.get_or_create(profile=profile)
        
        # Check completion status before update
        is_complete, was_incomplete = check_doctor_profile_completion(doctor_profile, profile)

        # Update doctor profile
        doctor_serializer = DoctorProfileSerializer(
            doctor_profile, data=request.data, partial=True
        )
        doctor_serializer.is_valid(raise_exception=True)
        doctor_serializer.save()

        # Update user profile fields
        user_profile_updates = {}
        for field in ['name', 'phone', 'gender', 'address', 'avatar']:
            if field in request.data:
                user_profile_updates[field] = request.data[field]
        
        if user_profile_updates:
            UserProfile.objects.filter(user_id=actual_user_id).update(**user_profile_updates)
            profile.refresh_from_db()

        # Update onboarding status
        is_profile_complete, _ = check_doctor_profile_completion(doctor_profile, profile)
        update_onboarding_status(profile, is_profile_complete)

        # Notify admin on first completion
        is_now_complete = is_profile_complete
        if should_notify_admin(doctor_profile, was_incomplete, is_now_complete):
            notify_admin_new_doctor.delay(
                doctor_name=profile.name or profile.email.split('@')[0],
                doctor_email=profile.email,
                doctor_id=profile.user_id
            )
            
            # Auto-approve if enabled
            auto_approve_doctor_if_enabled(doctor_profile, profile)

        # Prepare response
        doctor_profile.refresh_from_db()
        updated_doctor_serializer = DoctorProfileSerializer(doctor_profile)
        response_data = updated_doctor_serializer.data
        
        # Add user profile fields
        for field in ['name', 'phone', 'gender', 'address', 'avatar']:
            response_data[field] = getattr(profile, field)
        
        return Response(response_data)


# =========================================================
# DOCTOR DOCUMENTS
# =========================================================
class UploadDoctorDocumentAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor, IsOwner]

    def post(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        self.check_object_permissions(request, profile)

        file = request.FILES.get('file')
        doc_type = request.data.get('doc_type')
        
        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not doc_type:
            return Response(
                {'error': 'Document type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Upload to S3
            file_url, file_key = upload_file_to_s3(file, profile.user_id, doc_type)
            
            # Save to database
            data = {
                'profile': profile.id,
                'doc_type': doc_type,
                'file_url': file_url,
                'file_key': file_key
            }
            
            serializer = DoctorDocumentSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            document = serializer.save()
            
            # Notify admin
            doctor_profile = profile.doctor
            if doctor_profile and doctor_profile.doctor_status == 'pending':
                notify_admin_new_doctor.delay(
                    doctor_name=profile.name or profile.email.split('@')[0],
                    doctor_email=profile.email,
                    doctor_id=profile.user_id
                )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ListDoctorDocumentsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        
        if not hasattr(request, 'user_data'):
            return Response(
                {'detail': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_role = request.user_data.get('role')
        requesting_user_id = request.user_data.get('user_id')
        
        # Check permissions
        is_admin = user_role == 'admin'
        is_owner = user_role == 'doctor' and str(requesting_user_id) == str(actual_user_id)
        
        if not (is_admin or is_owner):
            return Response(
                {'detail': 'You don\'t have permission to view these documents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        docs = profile.documents.all()
        return Response(DoctorDocumentSerializer(docs, many=True).data)


class GetDoctorDocumentAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, document_id):
        document = get_object_or_404(DoctorDocument, id=document_id)
        
        if not hasattr(request, 'user_data'):
            return Response(
                {'detail': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_role = request.user_data.get('role')
        requesting_user_id = request.user_data.get('user_id')
        
        has_permission, error_message = check_document_access_permission(
            requesting_user_id, user_role, document
        )
        
        if not has_permission:
            return Response(
                {'detail': error_message}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Handle file access
        if not document.file_key:
            if document.file_url:
                return Response({'presigned_url': document.file_url})
            else:
                return Response(
                    {'error': 'Document has no file access information'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        try:
            presigned_url = generate_presigned_url(document.file_key)
            return Response({'presigned_url': presigned_url})
        except Exception as e:
            return Response(
                {'error': f'Failed to generate document access URL: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# =========================================================
# DOCTOR AVAILABILITY
# =========================================================
class AddAvailabilityAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor]

    def post(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        
        # Check if the requesting user is the same as the user_id (for security)
        if request.user_data['user_id'] != actual_user_id:
            return Response(
                {'detail': 'You can only add availability for yourself'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        get_object_or_404(DoctorProfile, profile=profile)

        data = {**request.data, "profile": profile.id}
        serializer = DoctorAvailabilitySerializer(data=data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"errors": serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class DeleteAvailabilityAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor]

    def delete(self, request, availability_id):
        availability = get_object_or_404(
            DoctorAvailability,
            id=availability_id,
            profile__user_id=request.user_data["user_id"],
        )
        availability.delete()
        return Response({"detail": "Deleted"})


class ListAvailabilityAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        availability = profile.availability.all()
        
        return Response(
            DoctorAvailabilitySerializer(availability, many=True).data
        )


# =========================================================
# ADMIN — DOCTOR APPROVAL
# =========================================================
class ApproveDoctorAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsAdmin]

    def post(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        doctor = get_object_or_404(DoctorProfile, profile=profile)

        doctor.doctor_status = "approved"
        doctor.save()

        # Send notifications
        send_doctor_status_email.delay(profile.email, "approved")
        Notification.objects.create(
            user_profile=profile,
            title="🎉 Doctor Profile Approved",
            message="Congratulations! Your doctor profile has been approved. You can now accept appointments.",
        )

        return Response({"detail": "Doctor approved"})


class RejectDoctorAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsAdmin]

    def post(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        doctor = get_object_or_404(DoctorProfile, profile=profile)

        doctor.doctor_status = "rejected"
        doctor.save()

        # Send notifications
        send_doctor_status_email.delay(profile.email, "rejected")
        Notification.objects.create(
            user_profile=profile,
            title="❌ Doctor Profile Rejected",
            message="Your doctor profile was rejected. Please contact support to reapply.",
        )

        return Response({"detail": "Doctor rejected"})


# =========================================================
# ADMIN — USER MANAGEMENT
# =========================================================
class UserManagementListAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsAdmin]

    def get(self, request):
        search = request.GET.get("search", "")
        role = request.GET.get("role")
        status_filter = request.GET.get("status")

        users = filter_users_by_search_and_role(search, role, status_filter)
        return Response(UserProfileSerializer(users, many=True).data)


class DeleteUserAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsAdmin]

    def delete(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        
        # Delete related data
        if hasattr(profile, 'doctor'):
            profile.doctor.delete()
        
        DoctorDocument.objects.filter(profile=profile).delete()
        DoctorAvailability.objects.filter(profile=profile).delete()
        DoctorRating.objects.filter(user=profile).delete()
        DoctorRating.objects.filter(doctor=profile).delete()
        Notification.objects.filter(user_profile=profile).delete()
        MoodEntry.objects.filter(user_profile=profile).delete()
        
        profile.delete()
        
        return Response({"detail": "User deleted successfully"})


# =========================================================
# NOTIFICATIONS
# =========================================================
class NotificationListAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsOwner]

    def get(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        self.check_object_permissions(request, profile)

        notifications = Notification.objects.filter(user_profile=profile)
        return Response(NotificationSerializer(notifications, many=True).data)


# =========================================================
# PUBLIC — APPROVED DOCTORS LIST
# =========================================================
class PublicDoctorListAPIView(APIView):
    permission_classes = []

    def get(self, request):
        doctors = DoctorProfile.objects.all().select_related("profile")

        data = []
        for d in doctors:
            data.append({
                "user_id": d.profile.user_id,
                "name": d.profile.name,
                "specialization": d.specialization,
                "experience": d.experience_years,
                "consultation_fee": d.consultation_fee,
                "average_rating": d.average_rating,
                "total_ratings": d.total_ratings,
                "doctor_status": d.doctor_status,
            })

        return Response(data)


# =========================================================
# DOCTOR RATINGS
# =========================================================
class RateDoctorAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def post(self, request, doctor_id):
        actual_doctor_id = convert_to_integer_id(doctor_id)
        
        doctor_profile = get_object_or_404(
            DoctorProfile.objects.select_related('profile'), 
            profile__user_id=actual_doctor_id,
            doctor_status='approved'
        )
        
        user_profile = get_object_or_404(
            UserProfile, 
            user_id=request.user_data['user_id']
        )
        
        # Prevent self-rating
        if user_profile.role == 'doctor' and user_profile.user_id == actual_doctor_id:
            return Response(
                {"detail": "You cannot rate yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rating = request.data.get('rating')
        review = request.data.get('review', '')
        
        # Validate rating
        is_valid, error_message = validate_rating(rating)
        if not is_valid:
            return Response(
                {"detail": error_message},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update rating
        rating_obj, created = DoctorRating.objects.update_or_create(
            doctor=doctor_profile.profile,
            user=user_profile,
            defaults={'rating': rating, 'review': review}
        )
        
        serializer = DoctorRatingSerializer(rating_obj)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


# =========================================================
# DOCTOR SUGGESTIONS BASED ON SEVERITY SCORE
# =========================================================
class DoctorSuggestionAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWTOrInternalService]

    def post(self, request):
        severity_score = request.data.get('severity_score')
        triage_profile = request.data.get('triage_profile')  # Accept the full triage profile
        
        # If triage profile is provided, use it instead of just severity score
        if triage_profile:
            severity_level = triage_profile.get('severity_level')
            required_specialist = triage_profile.get('specialist_type')
        else:
            # Validate severity score if no triage profile provided
            if severity_score is not None:
                is_valid, error_message = validate_severity_score(severity_score)
                if not is_valid:
                    return Response(
                        {"detail": error_message},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Calculate severity level
                severity_level = calculate_severity_level(severity_score)
                required_specialist = None
            else:
                return Response(
                    {"detail": "Either severity_score or triage_profile must be provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get doctors by severity or required specialist type
        if required_specialist:
            # Apply rule-based overrides from triage profile
            # Ensure critical safety rules override all other considerations
            if triage_profile and triage_profile.get('red_flags', {}).get('suicidal_ideation'):
                doctors = get_doctors_by_severity('CRITICAL')  # Force psychiatrist
                logger.info(f"Safety override: Redirecting to psychiatrist due to suicidal ideation flag")
            elif triage_profile and triage_profile.get('red_flags', {}).get('psychosis_indicators'):
                doctors = get_doctors_by_severity('CRITICAL')  # Force psychiatrist
                logger.info(f"Safety override: Redirecting to psychiatrist due to psychosis indicators")
            else:
                # Get doctors based on required specialist type
                if required_specialist == 'psychiatrist':
                    doctors = get_doctors_by_severity('CRITICAL')
                elif required_specialist == 'psychologist':
                    doctors = get_doctors_by_severity('MODERATE')
                else:  # counselor
                    doctors = get_doctors_by_severity('LOW')
        else:
            doctors = get_doctors_by_severity(severity_level)
        
        # Additional safety check: if triage requires manual review, limit options
        if triage_profile and triage_profile.get('requires_manual_review', False):
            logger.warning(f"Low confidence triage detected. Limiting doctor options for manual review.")
            # For low confidence cases, only return highly qualified doctors
            doctors = doctors.filter(experience_years__gte=5)  # Only experienced doctors for uncertain cases
        
        # Get top matched doctors using triage profile if available
        top_doctors = get_top_matched_doctors(doctors, limit=5, triage_profile=triage_profile)
        
        # Format response
        result = {
            'severity_level': severity_level,
            'severity_score': severity_score,
            'suggested_doctors': []
        }
        
        if triage_profile:
            result['triage_profile_used'] = True
            result['urgency_level'] = triage_profile.get('urgency_level', 'routine')
            result['red_flags'] = triage_profile.get('red_flags', {})
            result['dominant_symptoms'] = triage_profile.get('dominant_symptoms', [])
        
        for item in top_doctors:
            doctor = item['doctor']
            result['suggested_doctors'].append({
                'user_id': doctor.profile.user_id,
                'name': doctor.profile.name,
                'email': doctor.profile.email,
                'specialization': doctor.specialization,
                'experience_years': doctor.experience_years,
                'consultation_fee': doctor.consultation_fee,
                'average_rating': round(doctor.average_rating, 1),
                'total_ratings': doctor.total_ratings,
                'match_score': round(item['score'] * 100, 1),
                'triage_based_match': item.get('triage_based', False),
            })
        
        return Response(result)


# =========================================================
# MOOD TRACKING
# =========================================================
class SubmitMoodEntryAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def post(self, request):
        if not hasattr(request, 'user_data'):
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id = request.user_data['user_id']
        user_profile = get_object_or_404(UserProfile, user_id=user_id)
        
        data = request.data.copy()
        data['user_profile'] = user_profile.id
        
        serializer = MoodEntrySerializer(data=data)
        if serializer.is_valid():
            mood_entry = serializer.save(user_profile=user_profile)
            
            # Publish event for Lambda processing
            mood_data = {
                'user_id': str(user_profile.user_id),
                'user_email': user_profile.email,
                'mood_score': mood_entry.mood_score,
                'anxiety_level': mood_entry.anxiety_level,
                'energy_level': mood_entry.energy_level,
                'sleep_hours': mood_entry.sleep_hours,
                'notes': mood_entry.notes,
                'created_at': mood_entry.created_at.isoformat()
            }
            publish_mood_event(mood_data)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetMoodHistoryAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        user_profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        
        # Check ownership
        if request.user_data['user_id'] != user_profile.user_id:
            return Response(
                {'detail': 'You can only access your own mood history'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mood_entries = MoodEntry.objects.filter(
            user_profile=user_profile
        ).order_by('-created_at')
        
        serializer = MoodEntrySerializer(mood_entries, many=True)
        return Response(serializer.data)


class GetMoodTrendsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        actual_user_id = convert_to_integer_id(user_id)
        user_profile = get_object_or_404(UserProfile, user_id=actual_user_id)
        
        # Check ownership
        if request.user_data['user_id'] != user_profile.user_id:
            return Response(
                {'detail': 'You can only access your own mood trends'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mood_entries = MoodEntry.objects.filter(
            user_profile=user_profile
        ).order_by('-created_at')
        
        if mood_entries.count() == 0:
            return Response({'message': 'No mood data available for trend analysis'})
        
        # Calculate metrics
        metrics = calculate_average_mood_metrics(mood_entries)
        trend = calculate_mood_trend(mood_entries)
        
        trends_data = {
            **metrics,
            'trend': trend
        }
        
        return Response(trends_data)


# =========================================================
# MOOD AGGREGATION FOR DOCTORS
# =========================================================
class DoctorMoodDashboardAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor]

    def get(self, request):
        doctor_profile = get_object_or_404(
            DoctorProfile, 
            profile_id=request.user_data['user_id']
        )
        
        days = int(request.GET.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        
        # Get patients with mood entries
        patient_profiles = UserProfile.objects.filter(
            mood_entries__created_at__gte=start_date
        ).distinct()
        
        mood_data = []
        
        for patient in patient_profiles:
            patient_mood_entries = MoodEntry.objects.filter(
                user_profile=patient,
                created_at__gte=start_date
            ).order_by('-created_at')
            
            if patient_mood_entries.exists():
                mood_entries_list = [
                    format_mood_entry_data(entry) 
                    for entry in patient_mood_entries
                ]
                
                stats = calculate_patient_mood_statistics(patient_mood_entries)
                
                patient_data = {
                    'patient_id': patient.user_id,
                    'patient_name': patient.name or patient.email,
                    **stats,
                    'mood_entries': mood_entries_list[:5]
                }
                
                mood_data.append(patient_data)
        
        # Calculate overall statistics
        overall_stats = self._calculate_overall_stats(mood_data)
        
        response_data = {
            'doctor_name': doctor_profile.profile.name,
            'period_days': days,
            'from_date': start_date.strftime('%Y-%m-%d'),
            'to_date': timezone.now().strftime('%Y-%m-%d'),
            'overall_stats': overall_stats,
            'patients_data': mood_data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    def _calculate_overall_stats(self, patients_data):
        if not patients_data:
            return {
                'total_patients': 0,
                'total_mood_entries': 0,
                'average_patient_mood': 0,
                'concerning_patients_count': 0,
                'patients_with_data': 0
            }
        
        total_patients = len(patients_data)
        total_entries = sum(p['total_entries'] for p in patients_data)
        total_mood = sum(
            p['average_mood'] * p['total_entries'] 
            for p in patients_data if p['total_entries'] > 0
        )
        concerning_patients = sum(
            1 for p in patients_data if p['concerning_entries_count'] > 0
        )
        patients_with_data = sum(
            1 for p in patients_data if p['total_entries'] > 0
        )
        
        average_patient_mood = (
            total_mood / sum(p['total_entries'] for p in patients_data if p['total_entries'] > 0)
            if sum(p['total_entries'] for p in patients_data if p['total_entries'] > 0) > 0
            else 0
        )
        
        return {
            'total_patients': total_patients,
            'total_mood_entries': total_entries,
            'average_patient_mood': round(average_patient_mood, 2),
            'concerning_patients_count': concerning_patients,
            'patients_with_data': patients_with_data
        }


class PatientMoodHistoryAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor]

    def get(self, request, patient_user_id):
        doctor_profile = get_object_or_404(
            DoctorProfile, 
            profile_id=request.user_data['user_id']
        )
        
        patient_profile = get_object_or_404(UserProfile, user_id=patient_user_id)
        
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        mood_entries = MoodEntry.objects.filter(
            user_profile=patient_profile,
            created_at__gte=start_date
        ).order_by('-created_at')
        
        mood_history = [format_mood_entry_data(entry) for entry in mood_entries]
        patient_stats = calculate_patient_mood_statistics(mood_entries)
        
        response_data = {
            'patient_id': patient_profile.user_id,
            'patient_name': patient_profile.name or patient_profile.email,
            'period_days': days,
            'from_date': start_date.strftime('%Y-%m-%d'),
            'to_date': timezone.now().strftime('%Y-%m-%d'),
            'stats': patient_stats,
            'mood_history': mood_history
        }
        
        return Response(response_data, status=status.HTTP_200_OK)