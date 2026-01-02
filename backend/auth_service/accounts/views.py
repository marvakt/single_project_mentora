
# import os
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.contrib.auth import authenticate, get_user_model
# from jose import jwt, JWTError

# from .serializers import (
#     RegisterSerializer,
#     LoginSerializer,
# )

# from .utils import (
#     generate_otp,
#     store_otp,
#     send_otp_email,
#     get_stored_otp,
#     delete_otp,
#     create_access_token,
#     create_refresh_token,
#     verify_google_id_token,
#     create_profile_in_user_service,
# )

# User = get_user_model()

# JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret")
# JWT_ALG = "HS256"


# # ============================
# # REGISTER
# # ============================
# class RegisterAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         serializer = RegisterSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         email = serializer.validated_data["email"]
#         password = serializer.validated_data["password"]
#         role = serializer.validated_data["role"]

#         otp = generate_otp()
#         store_otp(email, f"{otp}|{password}|{role}")
#         send_otp_email(email, otp)

#         return Response({"detail": "OTP sent"}, status=200)


# # ============================
# # VERIFY OTP (ATOMIC)
# # ============================
# class VerifyOTPAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         email = request.data.get("email")
#         otp = request.data.get("otp")

#         stored = get_stored_otp(email)
#         if not stored:
#             return Response({"detail": "OTP expired"}, status=400)

#         stored_otp, password, role = stored.split("|")
#         if stored_otp != otp:
#             return Response({"detail": "Invalid OTP"}, status=400)

#         # Create user
#         user = User.objects.create_user(
#             email=email,
#             password=password,
#             role=role,
#         )
#         user.is_active = True
#         user.save()

#         # Create profile (MANDATORY)
#         ok = create_profile_in_user_service(user.id, user.email, user.role)
#         if not ok:
#             user.delete()
#             return Response(
#                 {"detail": "Profile creation failed. Registration aborted."},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             )

#         delete_otp(email)

#         payload = {
#             "user_id": user.id,
#             "email": user.email,
#             "role": user.role,
#         }

#         return Response(
#             {
#                 "access": create_access_token(payload),
#                 "refresh": create_refresh_token(payload),
#                 "user": payload,
#             },
#             status=200,
#         )


# # ============================
# # LOGIN
# # ============================
# class LoginAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         serializer = LoginSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         user = authenticate(
#             username=serializer.validated_data["email"],
#             password=serializer.validated_data["password"],
#         )

#         if not user:
#             return Response({"detail": "Invalid credentials"}, status=401)

#         payload = {
#             "user_id": user.id,
#             "email": user.email,
#             "role": user.role,
#         }

#         return Response(
#             {
#                 "access": create_access_token(payload),
#                 "refresh": create_refresh_token(payload),
#                 "user": payload,
#             }
#         )


# # ============================
# # GOOGLE AUTH (ATOMIC)
# # ============================
# class GoogleAuthAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         id_token = request.data.get("id_token")
#         info = verify_google_id_token(id_token)

#         if not info or not info.get("email"):
#             return Response({"detail": "Invalid Google token"}, status=400)

#         email = info["email"]

#         user, created = User.objects.get_or_create(
#             email=email,
#             defaults={"role": "user", "is_active": True},
#         )

#         if created:
#             user.set_unusable_password()
#             user.save()

#             ok = create_profile_in_user_service(user.id, user.email, user.role)
#             if not ok:
#                 user.delete()
#                 return Response(
#                     {"detail": "Profile creation failed"},
#                     status=500,
#                 )

#         payload = {
#             "user_id": user.id,
#             "email": user.email,
#             "role": user.role,
#         }

#         return Response(
#             {
#                 "access": create_access_token(payload),
#                 "refresh": create_refresh_token(payload),
#                 "user": payload,
#             }
#         )


# # ============================
# # FORGOT PASSWORD
# # ============================
# class ForgotPasswordAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         email = request.data.get("email")

#         if not User.objects.filter(email=email).exists():
#             return Response({"detail": "User not found"}, status=404)

#         otp = generate_otp()
#         store_otp(email, otp)
#         send_otp_email(email, otp)

#         return Response({"detail": "OTP sent"})


# # ============================
# # RESET PASSWORD
# # ============================
# class ResetPasswordAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         email = request.data.get("email")
#         otp = request.data.get("otp")
#         new_password = request.data.get("new_password")

#         stored = get_stored_otp(email)
#         if not stored or stored != otp:
#             return Response({"detail": "Invalid OTP"}, status=400)

#         user = User.objects.get(email=email)
#         user.set_password(new_password)
#         user.save()

#         delete_otp(email)
#         return Response({"detail": "Password reset successful"})


# # ============================
# # VERIFY TOKEN
# # ============================
# class VerifyTokenAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         token = request.data.get("token")

#         try:
#             payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
#             return Response(payload)
#         except JWTError:
#             return Response({"detail": "Invalid token"}, status=401)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .serializers import (
    RegisterSerializer,
    VerifyOTPSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    VerifyTokenSerializer,
)
from .utils import (
    handle_registration,
    handle_otp_verification,
    handle_google_authentication,
    handle_password_reset_request,
    handle_password_reset,
    verify_jwt_token,
    generate_auth_response,
)


# ============================
# REGISTER
# ============================
class RegisterAPIView(APIView):
    permission_classes = []
    
    @swagger_auto_schema(
        operation_summary="Register a new user",
        operation_description="Register a new user and send OTP to email",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='User email address'),
                'password': openapi.Schema(type=openapi.TYPE_STRING, format='password', description='User password (min 8 characters)'),
                'role': openapi.Schema(type=openapi.TYPE_STRING, enum=['user', 'doctor'], description='User role')
            },
            required=['email', 'password', 'role']
        ),
        responses={
            200: openapi.Response('OTP sent'),
            400: 'Bad Request'
        }
    )
    def post(self, request):
        """
        Register a new user
        
        Request body:
        {
            "email": "user@example.com",
            "password": "securepassword123",
            "role": "user" or "doctor"
        }
        
        Response:
        {
            "detail": "OTP sent"
        }
        """
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = handle_registration(serializer.validated_data)
        return Response(result["data"], status=result["status"])


# ============================
# VERIFY OTP (ATOMIC)
# ============================
class VerifyOTPAPIView(APIView):
    permission_classes = []
    
    @swagger_auto_schema(
        operation_summary="Verify OTP for registration",
        operation_description="Verify the OTP sent to user's email to complete registration",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='User email address'),
                'otp': openapi.Schema(type=openapi.TYPE_STRING, description='6-digit OTP code')
            },
            required=['email', 'otp']
        ),
        responses={
            200: openapi.Response(
                'Registration successful',
                examples={
                    'application/json': {
                        'access': 'jwt_access_token',
                        'refresh': 'jwt_refresh_token',
                        'user': {
                            'user_id': 1,
                            'email': 'user@example.com',
                            'role': 'user'
                        }
                    }
                }
            ),
            400: 'Bad Request'
        }
    )
    def post(self, request):
        """
        Verify OTP for registration
        
        Request body:
        {
            "email": "user@example.com",
            "otp": "123456"
        }
        
        Response:
        {
            "access": "jwt_access_token",
            "refresh": "jwt_refresh_token",
            "user": {
                "user_id": 1,
                "email": "user@example.com",
                "role": "user"
            }
        }
        """
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = handle_otp_verification(serializer.validated_data)
        return Response(result["data"], status=result["status"])


# ============================
# LOGIN
# ============================
class LoginAPIView(APIView):
    permission_classes = []
    
    @swagger_auto_schema(
        operation_summary="Login user",
        operation_description="Authenticate user and return JWT tokens",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='User email address'),
                'password': openapi.Schema(type=openapi.TYPE_STRING, format='password', description='User password')
            },
            required=['email', 'password']
        ),
        responses={
            200: openapi.Response(
                'Login successful',
                examples={
                    'application/json': {
                        'access': 'jwt_access_token',
                        'refresh': 'jwt_refresh_token',
                        'user': {
                            'user_id': 1,
                            'email': 'user@example.com',
                            'role': 'user'
                        }
                    }
                }
            ),
            401: 'Invalid credentials'
        }
    )
    def post(self, request):
        """
        Login user
        
        Request body:
        {
            "email": "user@example.com",
            "password": "securepassword123"
        }
        
        Response:
        {
            "access": "jwt_access_token",
            "refresh": "jwt_refresh_token",
            "user": {
                "user_id": 1,
                "email": "user@example.com",
                "role": "user"
            }
        }
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        if not user:
            return Response(
                {"detail": "Invalid credentials"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response(generate_auth_response(user), status=status.HTTP_200_OK)


# ============================
# GOOGLE AUTH (ATOMIC)
# ============================
class GoogleAuthAPIView(APIView):
    permission_classes = []
    
    @swagger_auto_schema(
        operation_summary="Google OAuth authentication",
        operation_description="Authenticate user with Google OAuth token",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'id_token': openapi.Schema(type=openapi.TYPE_STRING, description='Google ID token')
            },
            required=['id_token']
        ),
        responses={
            200: openapi.Response(
                'Google authentication successful',
                examples={
                    'application/json': {
                        'access': 'jwt_access_token',
                        'refresh': 'jwt_refresh_token',
                        'user': {
                            'user_id': 1,
                            'email': 'user@example.com',
                            'role': 'user'
                        }
                    }
                }
            ),
            400: 'Invalid token'
        }
    )
    def post(self, request):
        """
        Google OAuth authentication
        
        Request body:
        {
            "id_token": "google_id_token"
        }
        
        Response:
        {
            "access": "jwt_access_token",
            "refresh": "jwt_refresh_token",
            "user": {
                "user_id": 1,
                "email": "user@example.com",
                "role": "user"
            }
        }
        """
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = handle_google_authentication(serializer.validated_data)
        return Response(result["data"], status=result["status"])


# ============================
# FORGOT PASSWORD
# ============================
class ForgotPasswordAPIView(APIView):
    permission_classes = []
    
    @swagger_auto_schema(
        operation_summary="Request password reset",
        operation_description="Request password reset and send OTP to email",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='User email address')
            },
            required=['email']
        ),
        responses={
            200: openapi.Response('OTP sent'),
            400: 'Bad Request',
            404: 'User not found'
        }
    )
    def post(self, request):
        """
        Request password reset
        
        Request body:
        {
            "email": "user@example.com"
        }
        
        Response:
        {
            "detail": "OTP sent"
        }
        """
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = handle_password_reset_request(serializer.validated_data)
        return Response(result["data"], status=result["status"])


# ============================
# RESET PASSWORD
# ============================
class ResetPasswordAPIView(APIView):
    permission_classes = []
    
    @swagger_auto_schema(
        operation_summary="Reset password with OTP",
        operation_description="Reset user password using OTP verification",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='User email address'),
                'otp': openapi.Schema(type=openapi.TYPE_STRING, description='6-digit OTP code'),
                'new_password': openapi.Schema(type=openapi.TYPE_STRING, format='password', description='New password (min 8 characters)')
            },
            required=['email', 'otp', 'new_password']
        ),
        responses={
            200: openapi.Response('Password reset successful'),
            400: 'Bad Request'
        }
    )
    def post(self, request):
        """
        Reset password with OTP
        
        Request body:
        {
            "email": "user@example.com",
            "otp": "123456",
            "new_password": "newsecurepassword123"
        }
        
        Response:
        {
            "detail": "Password reset successful"
        }
        """
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = handle_password_reset(serializer.validated_data)
        return Response(result["data"], status=result["status"])


# ============================
# VERIFY TOKEN
# ============================
class VerifyTokenAPIView(APIView):
    permission_classes = []
    
    @swagger_auto_schema(
        operation_summary="Verify JWT token",
        operation_description="Verify the validity of a JWT token",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'token': openapi.Schema(type=openapi.TYPE_STRING, description='JWT token to verify')
            },
            required=['token']
        ),
        responses={
            200: openapi.Response(
                'Token is valid',
                examples={
                    'application/json': {
                        'user_id': 1,
                        'email': 'user@example.com',
                        'role': 'user',
                        'type': 'access'
                    }
                }
            ),
            401: 'Invalid token'
        }
    )
    def post(self, request):
        """
        Verify JWT token
        
        Request body:
        {
            "token": "jwt_token_to_verify"
        }
        
        Response (if valid):
        {
            "user_id": 1,
            "email": "user@example.com",
            "role": "user",
            "type": "access"
        }
        
        Response (if invalid):
        {
            "detail": "Invalid token"
        }
        """
        serializer = VerifyTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = verify_jwt_token(serializer.validated_data["token"])
        
        if result["valid"]:
            return Response(result["payload"], status=status.HTTP_200_OK)
        
        return Response(
            {"detail": result["error"]}, 
            status=status.HTTP_401_UNAUTHORIZED
        )