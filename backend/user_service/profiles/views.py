import uuid
import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db.models import Q

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
    DoctorProfileWithRatingSerializer,
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
from .services import MoodTrackingService

# Event producer
from .producer import publish_doctor_approved, publish_doctor_rejected


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
            defaults={
                "email": email,
                "role": role,
                "status": "active",
            }
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
        # Handle doctor_id which might be UUID string or integer
        # The doctor_id from appointment service might be a UUID string
        print(f"DEBUG: Received doctor_id: {doctor_id} (type: {type(doctor_id)})")
        
        # Try to find the doctor with different ID formats
        profile = None
        actual_doctor_id = doctor_id
        
        # If it's a string, first check if it's a UUID that needs conversion
        if isinstance(doctor_id, str):
            if len(doctor_id) == 36:
                # It's a UUID string, convert to integer
                try:
                    uuid_obj = uuid.UUID(doctor_id)
                    actual_doctor_id = uuid_obj.int
                    print(f"DEBUG: Converted UUID {doctor_id} to integer {actual_doctor_id}")
                    profile = UserProfile.objects.get(user_id=actual_doctor_id)
                    print(f"DEBUG: Found user with converted UUID integer ID: {actual_doctor_id}")
                except (ValueError, UserProfile.DoesNotExist):
                    print(f"DEBUG: UUID conversion failed for {doctor_id}")
                    pass
            elif doctor_id.isdigit():
                # It's a numeric string, convert to integer
                actual_doctor_id = int(doctor_id)
                print(f"DEBUG: Converted numeric string {doctor_id} to integer {actual_doctor_id}")
                try:
                    profile = UserProfile.objects.get(user_id=actual_doctor_id)
                    print(f"DEBUG: Found user with converted numeric ID: {actual_doctor_id}")
                except UserProfile.DoesNotExist:
                    print(f"DEBUG: User with converted numeric ID {actual_doctor_id} not found")
                    pass
        else:
            # It's not a string, try directly as integer
            try:
                profile = UserProfile.objects.get(user_id=doctor_id)
                print(f"DEBUG: Found user with original ID: {doctor_id}")
            except UserProfile.DoesNotExist:
                print(f"DEBUG: User with original ID {doctor_id} not found")
                pass
        
        if profile is None:
            print(f"DEBUG: Doctor with ID {doctor_id} not found in any format")
            return Response(
                {"detail": "Doctor not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Now get the doctor profile
        try:
            doctor_profile = DoctorProfile.objects.get(profile=profile)
        except DoctorProfile.DoesNotExist:
            print(f"DEBUG: Doctor profile does not exist for user {profile.user_id}")
            return Response(
                {"detail": "Doctor not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except:
            return Response(
                {"detail": "Doctor not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if doctor is approved
        is_approved = doctor_profile.doctor_status == "approved"
        
        # Check if doctor has completed onboarding
        is_onboarded = profile.onboarding_status == 100
        
        # Check if doctor has availability slots
        has_availability = profile.availability.exists()
        
        # Doctor is available if approved, onboarded, and has availability
        is_available = is_approved and is_onboarded and has_availability
        
        print(f"DEBUG: Doctor Availability Check for {doctor_id}")
        print(f"DEBUG: Approved: {is_approved}")
        print(f"DEBUG: Onboarded: {is_onboarded}")
        print(f"DEBUG: Has Availability Slots: {has_availability}")
        print(f"DEBUG: Final Available Status: {is_available}")

        response_data = {
            "approved": is_approved,
            "available": is_available,
            "onboarded": is_onboarded,
            "consultation_fee": doctor_profile.consultation_fee,
            "doctor_id": doctor_id,
            "name": profile.name or profile.email
        }

        return Response(response_data)


# =========================================================
# USER PROFILE
# =========================================================
class GetProfileAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        print(f"GetProfileAPIView called with user_id: {user_id}")
        if hasattr(request, 'user_data'):
            print(f"Request user_data: {request.user_data}")
        else:
            print("No user_data in request")
        
        # Handle user_id which might be UUID string or integer
        actual_user_id = user_id
        
        # If it's a string UUID, convert it to integer
        if isinstance(user_id, str) and len(user_id) == 36:
            # It's a UUID string, convert to integer
            try:
                uuid_obj = uuid.UUID(user_id)
                actual_user_id = uuid_obj.int
                print(f"DEBUG: Converted UUID {user_id} to integer {actual_user_id}")
            except ValueError:
                print(f"DEBUG: Invalid UUID format: {user_id}")
                return Response(
                    {"detail": "Invalid user ID format"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif isinstance(user_id, str) and user_id.isdigit():
            # It's a numeric string, convert to integer
            actual_user_id = int(user_id)
            print(f"DEBUG: Converted numeric string {user_id} to integer {actual_user_id}")
        
        profile = get_object_or_404(UserProfile.objects.select_related('doctor'), user_id=actual_user_id)
        print("JWT user_id:", request.user_data["user_id"])
        print("Profile user_id:", profile.user_id)
        
        # Check if user is trying to access their own profile
        # Handle comparison of different ID formats
        requesting_user_id = request.user_data["user_id"]
        
        # Convert both IDs to the same format for comparison
        # If requesting_user_id is a UUID string, convert to integer
        if isinstance(requesting_user_id, str) and len(requesting_user_id) == 36:
            try:
                requesting_user_id = uuid.UUID(requesting_user_id).int
            except ValueError:
                return Response(
                    {"detail": "Invalid requesting user ID format"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif isinstance(requesting_user_id, str) and requesting_user_id.isdigit():
            # If requesting_user_id is a numeric string, convert to integer
            requesting_user_id = int(requesting_user_id)
        
        # Convert profile.user_id to integer if it's a UUID string (though it should already be integer)
        profile_user_id = profile.user_id
        if isinstance(profile_user_id, str) and len(profile_user_id) == 36:
            try:
                profile_user_id = uuid.UUID(profile_user_id).int
            except ValueError:
                return Response(
                    {"detail": "Invalid profile user ID format"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif isinstance(profile_user_id, str) and profile_user_id.isdigit():
            # If profile_user_id is a numeric string, convert to integer
            profile_user_id = int(profile_user_id)
        
        # Allow access if:
        # 1. User is accessing their own profile, OR
        # 2. User is accessing a doctor's profile (for appointment-related functionality)
        is_own_profile = (requesting_user_id == profile_user_id)
        is_doctor_profile = (profile.role == 'doctor')
        
        if not is_own_profile and not is_doctor_profile:
            return Response(
                {"detail": f"Access denied. You can only access your own profile or doctor profiles. Requested user_id: {user_id}, Your user_id: {requesting_user_id}"},
                status=status.HTTP_403_FORBIDDEN
            )

        # For doctor profiles, we don't need the IsOwner permission check
        # For own profiles, we keep the IsOwner-like check
        if is_own_profile:
            # User accessing their own profile - apply ownership check
            self.check_object_permissions(request, profile)
        
        # Debug: check if doctor profile exists
        print(f"DEBUG: Profile {profile.id} has doctor profile: {hasattr(profile, 'doctor')}")
        if hasattr(profile, 'doctor') and profile.doctor:
            print(f"DEBUG: Doctor profile specialization: {profile.doctor.specialization}")
            print(f"DEBUG: Doctor profile experience: {profile.doctor.experience_years}")
            print(f"DEBUG: Doctor profile fee: {profile.doctor.consultation_fee}")
        else:
            print(f"DEBUG: No doctor profile found for user {profile.user_id}")
        
        response_data = UserProfileSerializer(profile).data
        print(f"DEBUG: Response data keys: {list(response_data.keys())}")
        if 'doctor' in response_data:
            print(f"DEBUG: Doctor data: {response_data['doctor']}")
        
        return Response(response_data)
    

class UpdateProfileAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsOwner]

    def put(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        
        # Check if user is trying to access their own profile
        if request.user_data["user_id"] != profile.user_id:
            return Response(
                {"detail": f"Access denied. You can only update your own profile. Requested user_id: {user_id}, Your user_id: {request.user_data['user_id']}"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.check_object_permissions(request, profile)

        serializer = UserProfileSerializer(
            profile, data=request.data, partial=True
        )
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
        profile = get_object_or_404(UserProfile, user_id=user_id)
        self.check_object_permissions(request, profile)

        doctor_profile, created = DoctorProfile.objects.get_or_create(profile=profile)
        
        # Check if this is first time completing profile
        was_incomplete = not (doctor_profile.specialization and profile.name and profile.phone)

        # Handle doctor profile updates
        doctor_serializer = DoctorProfileSerializer(
            doctor_profile, data=request.data, partial=True
        )
        doctor_serializer.is_valid(raise_exception=True)
        doctor_serializer.save()

        # Update user profile fields if they are provided in the request
        user_profile_updates = {}
        for field in ['name', 'phone', 'gender', 'address', 'avatar']:
            if field in request.data:
                user_profile_updates[field] = request.data[field]
        
        if user_profile_updates:
            UserProfile.objects.filter(user_id=user_id).update(**user_profile_updates)
            # Refresh the profile object to get updated values
            profile.refresh_from_db()

        # Update onboarding status if profile is complete
        is_profile_complete = (doctor_profile.specialization and profile.name and profile.phone)
        if is_profile_complete:
            profile.onboarding_status = 100
            profile.save(update_fields=['onboarding_status'])

        # ✅ Notify admin when doctor completes profile for first time
        is_now_complete = is_profile_complete
        if doctor_profile.doctor_status == 'pending' and was_incomplete and is_now_complete:
            notify_admin_new_doctor.delay(
                doctor_name=profile.name or profile.email.split('@')[0],
                doctor_email=profile.email,
                doctor_id=profile.user_id
            )
            
            # Auto-approve doctor in development mode (only if auto-approval is enabled)
            import os
            auto_approve_enabled = os.getenv('AUTO_APPROVE_DOCTORS', 'False').lower() == 'true'
            if auto_approve_enabled:
                doctor_profile.doctor_status = 'approved'
                doctor_profile.save()
                print(f"DEBUG: Auto-approved doctor {profile.user_id} based on AUTO_APPROVE_DOCTORS setting")

        # Refresh the doctor profile to get updated values
        doctor_profile.refresh_from_db()
        
        # Create a fresh serializer with updated data
        updated_doctor_serializer = DoctorProfileSerializer(doctor_profile)
        
        # Return combined response with both doctor profile and user profile info
        response_data = updated_doctor_serializer.data
        # Add user profile fields to the response
        response_data['name'] = profile.name
        response_data['phone'] = profile.phone
        response_data['gender'] = profile.gender
        response_data['address'] = profile.address
        response_data['avatar'] = profile.avatar
        
        return Response(response_data)


# =========================================================
# DOCTOR DOCUMENTS
# =========================================================
class UploadDoctorDocumentAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor, IsOwner]

    def post(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        self.check_object_permissions(request, profile)

        # Handle file upload to S3
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
        
        # Generate unique filename
        file_extension = file.name.split('.')[-1] if '.' in file.name else 'bin'
        unique_filename = f"doctor_documents/{profile.user_id}/{doc_type}_{uuid.uuid4().hex}.{file_extension}"
        
        try:
            # Upload file to S3
            s3_client = boto3.client(
                's3',
                aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
                aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
                region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
            )
            
            s3_client.upload_fileobj(
                file,
                getattr(settings, 'MOOD_REPORTS_S3_BUCKET', 'mentora-mood-reports'),
                unique_filename,
                ExtraArgs={
                    'ContentType': file.content_type if hasattr(file, 'content_type') else 'application/octet-stream',
                    'ACL': 'private'  # Set object as private to control access through our app
                }
            )
            
            # Generate the file URL
            file_url = f"https://{getattr(settings, 'MOOD_REPORTS_S3_BUCKET', 'mentora-mood-reports')}.s3.amazonaws.com/{unique_filename}"
            
            # Prepare data for serializer
            data = {
                'profile': profile.id,
                'doc_type': doc_type,
                'file_url': file_url,
                'file_key': unique_filename
            }
            
            serializer = DoctorDocumentSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            document = serializer.save()
            
            # Notify admin when a doctor uploads a document
            from .tasks import notify_admin_new_doctor
            doctor_profile = profile.doctor
            if doctor_profile:
                # Only notify if the doctor status is still pending
                if doctor_profile.doctor_status == 'pending':
                    notify_admin_new_doctor.delay(
                        doctor_name=profile.name or profile.email.split('@')[0],
                        doctor_email=profile.email,
                        doctor_id=profile.user_id
                    )
            
            return Response(serializer.data, status=201)
            
        except ClientError as e:
            return Response(
                {'error': f'Failed to upload file to S3: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'Unexpected error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ✅ FIXED: Allow admin to view doctor documents
class ListDoctorDocumentsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        
        # Check if user_data exists in request
        if not hasattr(request, 'user_data'):
            return Response(
                {'detail': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Allow admin or the doctor themselves
        user_role = request.user_data.get('role')
        requesting_user_id = request.user_data.get('user_id')
        
        # Debug: print user info to understand the issue
        print(f"DEBUG: Requesting user role: {user_role}, requesting_user_id: {requesting_user_id}, target user_id: {user_id}")
        
        if user_role == 'admin':
            # Admin can view any doctor's documents
            pass
        elif user_role == 'doctor' and str(requesting_user_id) == str(user_id):
            # Doctor can view their own documents
            # Ensure user_id comparison handles different formats
            pass
        elif user_role == 'user':
            # Regular users cannot access doctor documents
            return Response(
                {'detail': 'You don\'t have permission to view these documents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        else:
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
        # Debug: print the document_id being requested
        print(f"DEBUG: GetDoctorDocumentAPIView called with document_id: {document_id}")
        
        # Get the document
        try:
            document = get_object_or_404(DoctorDocument, id=document_id)
            print(f"DEBUG: Found document with id: {document.id}, file_key: {document.file_key}, profile_id: {document.profile.id}")
        except Exception as e:
            print(f"DEBUG: Document not found for id: {document_id}, error: {str(e)}")
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user_data exists in request
        if not hasattr(request, 'user_data'):
            print(f"DEBUG: No user_data in request")
            return Response(
                {'detail': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Allow admin or the doctor who owns the document
        user_role = request.user_data.get('role')
        requesting_user_id = request.user_data.get('user_id')
        
        print(f"DEBUG: Requesting user role: {user_role}, requesting_user_id: {requesting_user_id}, document owner: {document.profile.user_id}")
        
        # Check permissions
        is_admin = user_role == 'admin'
        is_owner = user_role == 'doctor' and str(requesting_user_id) == str(document.profile.user_id)
        
        if not (is_admin or is_owner):
            print(f"DEBUG: Permission denied - user is not admin or owner")
            return Response(
                {'detail': 'You don\'t have permission to access this document'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if file_key exists
        if not document.file_key:
            print(f"DEBUG: Document has no file_key, using file_url as fallback")
            # If there's no file_key but there's a file_url, return that directly
            if document.file_url:
                return Response({'presigned_url': document.file_url})
            else:
                return Response(
                    {'error': 'Document has no file access information'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Generate a presigned URL for secure access to the S3 object
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
                aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
                region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
            )
            
            print(f"DEBUG: Attempting to generate presigned URL for bucket: {getattr(settings, 'MOOD_REPORTS_S3_BUCKET', 'mentora-mood-reports')}, key: {document.file_key}")
            
            # Generate presigned URL valid for 1 hour
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': getattr(settings, 'MOOD_REPORTS_S3_BUCKET', 'mentora-mood-reports'),
                    'Key': document.file_key
                },
                ExpiresIn=3600  # 1 hour
            )
            
            print(f"DEBUG: Successfully generated presigned URL")
            return Response({'presigned_url': presigned_url})
            
        except Exception as e:
            print(f"DEBUG: Error generating presigned URL: {str(e)}")
            return Response(
                {'error': f'Failed to generate document access URL: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# =========================================================
# DOCTOR AVAILABILITY
# =========================================================
class AddAvailabilityAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor, IsOwner]

    def post(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        self.check_object_permissions(request, profile)
        get_object_or_404(DoctorProfile, profile=profile)

        data = {**request.data, "profile": profile.id}
        serializer = DoctorAvailabilitySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        else:
            return Response({"errors": serializer.errors}, status=400)


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
        profile = get_object_or_404(UserProfile, user_id=user_id)
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
        profile = get_object_or_404(UserProfile, user_id=user_id)
        doctor = get_object_or_404(DoctorProfile, profile=profile)

        doctor.doctor_status = "approved"
        doctor.save()

        # ✅ Send email notification to doctor
        send_doctor_status_email.delay(profile.email, "approved")
        
        # ✅ Send in-app notification to doctor
        from .models import Notification
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
        profile = get_object_or_404(UserProfile, user_id=user_id)
        doctor = get_object_or_404(DoctorProfile, profile=profile)

        doctor.doctor_status = "rejected"
        doctor.save()

        # ✅ Send email notification to doctor
        send_doctor_status_email.delay(profile.email, "rejected")
        
        # ✅ Send in-app notification to doctor
        from .models import Notification
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

        q = UserProfile.objects.all()

        if search:
            q = q.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(user_id__icontains=search)
            )

        if role and role != "all":
            q = q.filter(role=role)

        if status_filter == "active":
            q = q.filter(onboarding_status=100)
        elif status_filter == "pending":
            q = q.filter(onboarding_status__lt=100)

        # For admin user management, include doctor profile data if user is a doctor
        q = q.select_related('doctor')

        return Response(UserProfileSerializer(q, many=True).data)


class DeleteUserAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsAdmin]

    def delete(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
        
        # Delete all related data first
        if hasattr(profile, 'doctor'):
            profile.doctor.delete()
        
        # Delete related documents
        DoctorDocument.objects.filter(profile=profile).delete()
        
        # Delete availability
        DoctorAvailability.objects.filter(profile=profile).delete()
        
        # Delete ratings
        DoctorRating.objects.filter(user=profile).delete()  # ratings given by this user
        DoctorRating.objects.filter(doctor=profile).delete()  # ratings received by this user
        
        # Delete notifications
        Notification.objects.filter(user_profile=profile).delete()
        
        # Delete mood entries
        MoodEntry.objects.filter(user_profile=profile).delete()
        
        # Finally delete the profile
        profile.delete()
        
        return Response({"detail": "User deleted successfully"})


# =========================================================
# NOTIFICATIONS
# =========================================================
class NotificationListAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsOwner]

    def get(self, request, user_id):
        profile = get_object_or_404(UserProfile, user_id=user_id)
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
        # Get the doctor profile
        doctor_profile = get_object_or_404(
            DoctorProfile.objects.select_related('profile'), 
            profile__user_id=doctor_id,
            doctor_status='approved'
        )
        
        # Get the user profile
        user_profile = get_object_or_404(UserProfile, user_id=request.user_data['user_id'])
        
        # Prevent doctors from rating themselves
        if user_profile.role == 'doctor' and user_profile.user_id == doctor_id:
            return Response(
                {"detail": "You cannot rate yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get rating data
        rating = request.data.get('rating')
        review = request.data.get('review', '')
        
        # Validate rating
        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return Response(
                {"detail": "Rating must be an integer between 1 and 5"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update rating
        rating_obj, created = DoctorRating.objects.update_or_create(
            doctor=doctor_profile.profile,
            user=user_profile,
            defaults={
                'rating': rating,
                'review': review
            }
        )
        
        serializer = DoctorRatingSerializer(rating_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


# =========================================================
# DOCTOR SUGGESTIONS BASED ON SEVERITY SCORE
# =========================================================
class DoctorSuggestionAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWTOrInternalService]

    def post(self, request):
        # Get severity score from request
        severity_score = request.data.get('severity_score')
        
        # Validate severity score
        if not isinstance(severity_score, int) or severity_score < 0 or severity_score > 10:
            return Response(
                {"detail": "Severity score must be an integer between 0 and 10"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate severity level
        if severity_score <= 3:
            severity_level = 'LOW'
        elif severity_score <= 6:
            severity_level = 'MODERATE'
        elif severity_score <= 8:
            severity_level = 'HIGH'
        else:
            severity_level = 'CRITICAL'
        
        # Get all approved doctors
        # Get all doctors (relaxed filter for status, but strict for matching)
        base_query = DoctorProfile.objects.all().select_related("profile")
        
        # Filter by specialization based on severity
        if severity_level == 'LOW':
            doctors = base_query.filter(
                Q(specialization__icontains="counselor") | 
                Q(specialization__icontains="therapist") |
                Q(specialization__icontains="psychologist")
            )
        elif severity_level == 'MODERATE':
            doctors = base_query.filter(
                Q(specialization__icontains="psychologist") |
                Q(specialization__icontains="therapist")
            )
        else: # HIGH or CRITICAL
            doctors = base_query.filter(
                Q(specialization__icontains="psychiatrist") |
                Q(specialization__icontains="clinical")
            )
            
        # Fallback: If no specialists found, show all doctors sorted by rating
        if not doctors.exists():
            doctors = base_query
        
        # Score doctors based on rating and experience
        scored_doctors = []
        for doctor in doctors:
            # Base score from rating (weight: 0.6)
            rating_score = doctor.average_rating * 0.6 if doctor.average_rating else 0
            
            # Experience score (weight: 0.3)
            # Normalize experience to 0-1 scale (assuming max experience of 50 years)
            experience_score = min(doctor.experience_years / 50.0, 1.0) * 0.3
            
            # Availability score (weight: 0.1)
            # Doctors with more availability slots get higher scores
            availability_slots = doctor.profile.availability.count()
            availability_score = min(availability_slots / 20.0, 1.0) * 0.1
            
            # Total score
            total_score = rating_score + experience_score + availability_score
            
            scored_doctors.append({
                'doctor': doctor,
                'score': total_score,
                'rating_score': rating_score,
                'experience_score': experience_score,
                'availability_score': availability_score
            })
        
        # Sort doctors by score (descending)
        scored_doctors.sort(key=lambda x: x['score'], reverse=True)
        
        # Take top 5 doctors
        top_doctors = scored_doctors[:5]
        
        # Serialize the results
        result = {
            'severity_level': severity_level,
            'severity_score': severity_score,
            'suggested_doctors': []
        }
        
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
            })
        
        return Response(result)


# =========================================================
# MOOD TRACKING
# =========================================================
class SubmitMoodEntryAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def post(self, request):
        # Add user profile to the request data
        if not hasattr(request, 'user_data'):
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id = request.user_data['user_id']
        try:
            user_profile = UserProfile.objects.get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response(
                {'detail': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Add user profile to serializer data
        data = request.data.copy()
        data['user_profile'] = user_profile.id
        
        serializer = MoodEntrySerializer(data=data)
        if serializer.is_valid():
            mood_entry = serializer.save(user_profile=user_profile)
            
            # Publish event to SQS for Lambda processing
            service = MoodTrackingService()
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
            
            service.publish_mood_event(mood_data)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetMoodHistoryAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        try:
            user_profile = UserProfile.objects.get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response(
                {'detail': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is trying to access their own profile
        if request.user_data['user_id'] != user_profile.user_id:
            return Response(
                {'detail': 'You can only access your own mood history'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mood_entries = MoodEntry.objects.filter(user_profile=user_profile).order_by('-created_at')
        serializer = MoodEntrySerializer(mood_entries, many=True)
        return Response(serializer.data)


class GetMoodTrendsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT]

    def get(self, request, user_id):
        try:
            user_profile = UserProfile.objects.get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response(
                {'detail': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is trying to access their own profile
        if request.user_data['user_id'] != user_profile.user_id:
            return Response(
                {'detail': 'You can only access your own mood trends'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mood_entries = MoodEntry.objects.filter(user_profile=user_profile).order_by('-created_at')
        
        # Calculate trends
        if mood_entries.count() == 0:
            return Response({'message': 'No mood data available for trend analysis'})
        
        # Calculate average mood scores
        avg_mood = sum(entry.mood_score for entry in mood_entries) / mood_entries.count()
        avg_anxiety = sum(entry.anxiety_level for entry in mood_entries) / mood_entries.count()
        avg_energy = sum(entry.energy_level for entry in mood_entries) / mood_entries.count()
        
        # Determine trend (simple implementation - last 3 vs first 3 entries)
        entries_list = list(mood_entries)
        recent_entries = entries_list[:3]  # Last 3 entries (most recent)
        older_entries = entries_list[-3:]  # First 3 entries (oldest in the period)
        
        if len(recent_entries) >= 1 and len(older_entries) >= 1:
            recent_avg = sum(e.mood_score for e in recent_entries) / len(recent_entries)
            older_avg = sum(e.mood_score for e in older_entries) / len(older_entries)
            
            if recent_avg > older_avg + 1:
                trend = 'improving'
            elif recent_avg < older_avg - 1:
                trend = 'declining'
            else:
                trend = 'stable'
        else:
            trend = 'insufficient_data'
        
        trends_data = {
            'average_mood_score': round(avg_mood, 2),
            'average_anxiety_level': round(avg_anxiety, 2),
            'average_energy_level': round(avg_energy, 2),
            'trend': trend,
            'total_entries': mood_entries.count(),
        }
        
        return Response(trends_data)