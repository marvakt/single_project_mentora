# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.contrib.auth import authenticate, get_user_model

# from .serializers import RegisterSerializer, VerifyOTPSerializer, LoginSerializer
# from .utils import (
#     generate_otp, store_otp, send_otp_email, get_stored_otp, delete_otp,
#     create_access_token, create_refresh_token,
#     verify_google_id_token, create_profile_in_user_service
# )

# User = get_user_model()


# # ======================================================
# # REGISTER
# # ======================================================
# class RegisterAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         s = RegisterSerializer(data=request.data)
#         s.is_valid(raise_exception=True)

#         email = s.validated_data["email"]
#         password = s.validated_data["password"]
#         role = s.validated_data["role"]

#         otp = generate_otp()

#         # Store OTP + password + role inside Redis
#         store_otp(email, f"{otp}|{password}|{role}")

#         # Send OTP to user email
#         send_otp_email(email, otp)

#         return Response({"detail": "OTP sent to email."}, status=200)


# # ======================================================
# # VERIFY OTP
# # ======================================================
# class VerifyOTPAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         s = VerifyOTPSerializer(data=request.data)
#         s.is_valid(raise_exception=True)

#         email = s.validated_data["email"]
#         otp = s.validated_data["otp"]

#         stored = get_stored_otp(email)
#         if not stored:
#             return Response({"detail": "OTP expired"}, status=400)

#         try:
#             stored_otp, password, role = stored.split("|")
#         except ValueError:
#             return Response({"detail": "Corrupted OTP data"}, status=500)

#         # Validate OTP
#         if stored_otp != otp:
#             return Response({"detail": "Invalid OTP"}, status=400)

#         # Create user
#         user = User.objects.create_user(email=email, password=password, role=role)
#         user.is_active = True
#         user.save()

#         delete_otp(email)

#         # Create user profile inside USER SERVICE
#         create_profile_in_user_service(user.id, user.email, user.role)

#         payload = {
#             "user_id": user.id,
#             "email": user.email,
#             "role": user.role
#         }

#         return Response({
#             "access": create_access_token(payload),
#             "refresh": create_refresh_token(payload),
#             "user": payload  # <-- Frontend needs this
#         }, status=200)


# # ======================================================
# # LOGIN
# # ======================================================
# class LoginAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         s = LoginSerializer(data=request.data)
#         s.is_valid(raise_exception=True)

#         email = s.validated_data["email"]
#         password = s.validated_data["password"]

#         user = authenticate(request, username=email, password=password)
#         if not user:
#             return Response({"detail": "Invalid credentials"}, status=401)

#         payload = {
#             "user_id": user.id,
#             "email": user.email,
#             "role": user.role
#         }

#         return Response({
#             "access": create_access_token(payload),
#             "refresh": create_refresh_token(payload),
#             "user": payload
#         })


# # ======================================================
# # GOOGLE AUTH
# # ======================================================
# class GoogleAuthAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         id_token = request.data.get("id_token")
#         if not id_token:
#             return Response({"detail": "id_token required"}, status=400)

#         info = verify_google_id_token(id_token)
#         if not info:
#             return Response({"detail": "invalid google token"}, status=400)

#         email = info.get("email")
#         if not email:
#             return Response({"detail": "google token missing email"}, status=400)

#         user, created = User.objects.get_or_create(
#             email=email,
#             defaults={"is_active": True, "role": "user"}
#         )

#         if created:
#             user.set_unusable_password()
#             user.save()
#             create_profile_in_user_service(user.id, user.email, user.role)

#         payload = {
#             "user_id": user.id,
#             "email": user.email,
#             "role": user.role
#         }

#         return Response({
#             "access": create_access_token(payload),
#             "refresh": create_refresh_token(payload),
#             "user": payload
#         })


# # ======================================================
# # FORGOT PASSWORD
# # ======================================================
# class ForgotPasswordAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         email = request.data.get("email")
#         if not email:
#             return Response({"detail": "email required"}, status=400)

#         if not User.objects.filter(email=email).exists():
#             return Response({"detail": "No account found"}, status=404)

#         otp = generate_otp()
#         store_otp(email, otp)
#         send_otp_email(email, otp)

#         return Response({"detail": "OTP sent"}, status=200)


# # ======================================================
# # RESET PASSWORD
# # ======================================================
# class ResetPasswordAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         email = request.data.get("email")
#         otp = request.data.get("otp")
#         new_password = request.data.get("new_password")

#         if not all([email, otp, new_password]):
#             return Response({"detail": "missing fields"}, status=400)

#         stored = get_stored_otp(email)
#         if not stored or stored != otp:
#             return Response({"detail": "Invalid OTP"}, status=400)

#         try:
#             user = User.objects.get(email=email)
#         except User.DoesNotExist:
#             return Response({"detail": "User not found"}, status=404)

#         user.set_password(new_password)
#         user.save()
#         delete_otp(email)

#         return Response({"detail": "Password reset successful"}, status=200)




import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, get_user_model
from jose import jwt, JWTError

from .serializers import (
    RegisterSerializer,
    VerifyOTPSerializer,
    LoginSerializer,
)
from .utils import (
    generate_otp,
    store_otp,
    send_otp_email,
    get_stored_otp,
    delete_otp,
    create_access_token,
    create_refresh_token,
    verify_google_id_token,
    create_profile_in_user_service,
)

User = get_user_model()

JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret")
JWT_ALG = "HS256"


# ======================================================
# REGISTER
# ======================================================
class RegisterAPIView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]
        role = serializer.validated_data["role"]

        otp = generate_otp()

        # Store OTP + password + role in Redis
        store_otp(email, f"{otp}|{password}|{role}")

        # Send OTP email
        send_otp_email(email, otp)

        return Response(
            {"detail": "OTP sent to email"},
            status=status.HTTP_200_OK
        )


# ======================================================
# VERIFY OTP
# ======================================================
class VerifyOTPAPIView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        stored = get_stored_otp(email)
        if not stored:
            return Response({"detail": "OTP expired"}, status=400)

        try:
            stored_otp, password, role = stored.split("|")
        except ValueError:
            return Response({"detail": "Corrupted OTP data"}, status=500)

        if stored_otp != otp:
            return Response({"detail": "Invalid OTP"}, status=400)

        user = User.objects.create_user(
            email=email,
            password=password,
            role=role,
        )
        user.is_active = True
        user.save()

        delete_otp(email)

        # 🔥 Auto-create profile in user_service
        create_profile_in_user_service(user.id, user.email, user.role)

        payload = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
        }

        return Response(
            {
                "access": create_access_token(payload),
                "refresh": create_refresh_token(payload),
                "user": payload,
            },
            status=status.HTTP_200_OK
        )


# ======================================================
# LOGIN
# ======================================================
class LoginAPIView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({"detail": "Invalid credentials"}, status=401)

        payload = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
        }

        return Response(
            {
                "access": create_access_token(payload),
                "refresh": create_refresh_token(payload),
                "user": payload,
            },
            status=status.HTTP_200_OK
        )


# ======================================================
# GOOGLE AUTH
# ======================================================
class GoogleAuthAPIView(APIView):
    permission_classes = []

    def post(self, request):
        id_token = request.data.get("id_token")
        if not id_token:
            return Response({"detail": "id_token required"}, status=400)

        info = verify_google_id_token(id_token)
        if not info:
            return Response({"detail": "Invalid Google token"}, status=400)

        email = info.get("email")
        if not email:
            return Response({"detail": "Google token missing email"}, status=400)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"is_active": True, "role": "user"},
        )

        if created:
            user.set_unusable_password()
            user.save()
            create_profile_in_user_service(user.id, user.email, user.role)

        payload = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
        }

        return Response(
            {
                "access": create_access_token(payload),
                "refresh": create_refresh_token(payload),
                "user": payload,
            },
            status=status.HTTP_200_OK
        )


# ======================================================
# FORGOT PASSWORD
# ======================================================
class ForgotPasswordAPIView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "email required"}, status=400)

        if not User.objects.filter(email=email).exists():
            return Response({"detail": "No account found"}, status=404)

        otp = generate_otp()
        store_otp(email, otp)
        send_otp_email(email, otp)

        return Response({"detail": "OTP sent"}, status=200)


# ======================================================
# RESET PASSWORD
# ======================================================
class ResetPasswordAPIView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")
        new_password = request.data.get("new_password")

        if not all([email, otp, new_password]):
            return Response({"detail": "Missing fields"}, status=400)

        stored = get_stored_otp(email)
        if not stored or stored != otp:
            return Response({"detail": "Invalid OTP"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        user.set_password(new_password)
        user.save()
        delete_otp(email)

        return Response({"detail": "Password reset successful"}, status=200)


# ======================================================
# 🔐 VERIFY JWT TOKEN (INTERNAL + OTHER SERVICES)
# ======================================================
class VerifyTokenAPIView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response({"detail": "Token required"}, status=400)

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])

            if payload.get("type") != "access":
                return Response({"detail": "Invalid token type"}, status=401)

            return Response(
                {
                    "user_id": payload["user_id"],
                    "email": payload["email"],
                    "role": payload["role"],
                },
                status=200,
            )

        except JWTError:
            return Response({"detail": "Invalid token"}, status=401)
