# from django.urls import path
# from .views import (
#     RegisterAPIView,
#     VerifyOTPAPIView,
#     LoginAPIView,
#     GoogleAuthAPIView,
#     ForgotPasswordAPIView,
#     ResetPasswordAPIView
# )

# urlpatterns = [
#     path("register/", RegisterAPIView.as_view()),
#     path("verify-otp/", VerifyOTPAPIView.as_view()),
#     path("login/", LoginAPIView.as_view()),
#     path("google/", GoogleAuthAPIView.as_view()),
#     path("forgot-password/", ForgotPasswordAPIView.as_view(), name="forgot-password"),
#     path("reset-password/", ResetPasswordAPIView.as_view(), name="reset-password"),

# ]



from django.urls import path
from .views import (
    RegisterAPIView,
    VerifyOTPAPIView,
    LoginAPIView,
    GoogleAuthAPIView,
    ForgotPasswordAPIView,
    ResetPasswordAPIView,
    VerifyTokenAPIView,   # 🔥 REQUIRED
)

urlpatterns = [
    path("register/", RegisterAPIView.as_view()),
    path("verify-otp/", VerifyOTPAPIView.as_view()),
    path("login/", LoginAPIView.as_view()),
    path("google/", GoogleAuthAPIView.as_view()),
    path("forgot-password/", ForgotPasswordAPIView.as_view()),
    path("reset-password/", ResetPasswordAPIView.as_view()),

    # 🔐 INTERNAL + SERVICE-TO-SERVICE
    path("verify-token/", VerifyTokenAPIView.as_view()),
]
