



# # FILE: user_service/profiles/tasks.py

# from celery import shared_task
# from django.core.mail import send_mail
# from django.conf import settings
# import logging

# logger = logging.getLogger(__name__)


# @shared_task(
#     bind=True,
#     autoretry_for=(Exception,),
#     retry_kwargs={"max_retries": 3, "countdown": 10},
#     retry_backoff=True,
#     name="profiles.send_doctor_status_email",
# )
# def send_doctor_status_email(self, email: str, status: str):
#     """
#     Sends email when doctor is approved/rejected
#     """
#     try:
#         if status == "approved":
#             subject = "🎉 Congratulations! Your Doctor Profile is Approved"
#             message = f"""
# Dear Doctor,

# Congratulations! Your doctor profile has been APPROVED by our admin team.

# You can now:
# ✅ Accept patient appointments
# ✅ Conduct video consultations
# ✅ Access your doctor dashboard

# Login to start helping patients: https://mentora.com/login

# Best regards,
# Mentora Team
#             """
#         else:  # rejected
#             subject = "Doctor Profile Application Update"
#             message = f"""
# Dear Doctor,

# Thank you for your interest in joining Mentora.

# Unfortunately, your doctor profile has been REJECTED by our admin team.

# If you believe this is a mistake or would like to reapply, please contact our support team.

# Best regards,
# Mentora Team
#             """

#         send_mail(
#             subject,
#             message,
#             settings.DEFAULT_FROM_EMAIL,
#             [email],
#             fail_silently=False,
#         )

#         logger.info(f"Doctor status email sent to {email} ({status})")
#         return True

#     except Exception as exc:
#         logger.error(f"Doctor status email failed for {email}: {exc}")
#         raise self.retry(exc=exc)


# # ✅ NEW TASK: Notify admin when doctor registers
# @shared_task(
#     bind=True,
#     autoretry_for=(Exception,),
#     retry_kwargs={"max_retries": 3, "countdown": 10},
#     retry_backoff=True,
#     name="profiles.notify_admin_new_doctor",
# )
# def notify_admin_new_doctor(self, doctor_name: str, doctor_email: str, doctor_id: int):
#     """
#     Notifies admin when a new doctor registers
#     """
#     try:
#         admin_email = settings.ADMIN_NOTIFICATION_EMAIL
        
#         subject = f"🆕 New Doctor Registration: {doctor_name}"
#         message = f"""
# New Doctor Registration Alert!

# A new doctor has registered on Mentora platform:

# Name: {doctor_name}
# Email: {doctor_email}
# User ID: {doctor_id}

# Action Required:
# Please review their profile and documents at:
# https://mentora.com/admin/dashboard

# Navigate to Pending Approvals section to approve or reject.

# Mentora Admin System
#         """

#         send_mail(
#             subject,
#             message,
#             settings.DEFAULT_FROM_EMAIL,
#             [admin_email],
#             fail_silently=False,
#         )

#         logger.info(f"Admin notified about new doctor: {doctor_email}")
#         return True

#     except Exception as exc:
#         logger.error(f"Admin notification failed for doctor {doctor_email}: {exc}")
#         raise self.retry(exc=exc)


# @shared_task(
#     bind=True,
#     autoretry_for=(Exception,),
#     retry_kwargs={"max_retries": 3, "countdown": 30},
#     retry_backoff=True,
#     name="profiles.send_weekly_insight_email",
# )
# def send_weekly_insight_email(self, email: str, insight: str):
#     """
#     Sends weekly mental health insight email
#     """
#     try:
#         subject = "Your Weekly Mental Health Insight"

#         send_mail(
#             subject,
#             insight,
#             settings.DEFAULT_FROM_EMAIL,
#             [email],
#             fail_silently=False,
#         )

#         logger.info(f"Weekly insight email sent to {email}")
#         return True

#     except Exception as exc:
#         logger.error(f"Weekly insight email failed for {email}: {exc}")
#         raise self.retry(exc=exc)


# @shared_task(name="profiles.healthcheck")
# def celery_healthcheck():
#     """
#     Simple task to confirm Celery worker is alive
#     """
#     return "CELERY OK"




# from celery import shared_task
# from django.core.mail import send_mail
# from django.conf import settings
# import logging
# import json

# logger = logging.getLogger(__name__)


# @shared_task(
#     bind=True,
#     autoretry_for=(Exception,),
#     retry_kwargs={"max_retries": 3, "countdown": 10},
#     retry_backoff=True,
#     name="profiles.send_doctor_status_email",
# )
# def send_doctor_status_email(self, email: str, status: str):
#     """
#     Sends email when doctor is approved/rejected
#     """
#     try:
#         if status == "approved":
#             subject = "🎉 Congratulations! Your Doctor Profile is Approved"
#             message = """
# Dear Doctor,

# Congratulations! Your doctor profile has been APPROVED by our admin team.

# You can now:
# ✅ Accept patient appointments
# ✅ Conduct video consultations
# ✅ Access your doctor dashboard

# Login to start helping patients.

# Best regards,
# Mentora Team
#             """
#         else:
#             subject = "Doctor Profile Application Update"
#             message = """
# Dear Doctor,

# Thank you for applying to Mentora.

# Unfortunately, your doctor profile has been REJECTED.

# Please contact support if you wish to reapply.

# Best regards,
# Mentora Team
#             """

#         send_mail(
#             subject,
#             message,
#             settings.DEFAULT_FROM_EMAIL,
#             [email],
#             fail_silently=False,
#         )

#         logger.info(f"Doctor status email sent to {email} ({status})")
#         return True

#     except Exception as exc:
#         logger.error(f"Doctor status email failed for {email}: {exc}")
#         raise self.retry(exc=exc)


# @shared_task(
#     bind=True,
#     autoretry_for=(Exception,),
#     retry_kwargs={"max_retries": 3, "countdown": 10},
#     retry_backoff=True,
#     name="profiles.notify_admin_new_doctor",
# )
# def notify_admin_new_doctor(self, doctor_name: str, doctor_email: str, doctor_id: int):
#     """
#     Notifies admin when a new doctor registers
#     """
#     try:
#         subject = f"🆕 New Doctor Registration: {doctor_name}"
#         message = f"""
# New Doctor Registration Alert!

# Name: {doctor_name}
# Email: {doctor_email}
# User ID: {doctor_id}

# Please review and approve/reject in admin panel.
#         """

#         send_mail(
#             subject,
#             message,
#             settings.DEFAULT_FROM_EMAIL,
#             [settings.ADMIN_NOTIFICATION_EMAIL],
#             fail_silently=False,
#         )

#         logger.info(f"Admin notified about new doctor: {doctor_email}")
#         return True

#     except Exception as exc:
#         logger.error(f"Admin notification failed: {exc}")
#         raise self.retry(exc=exc)


# @shared_task(
#     bind=True,
#     autoretry_for=(Exception,),
#     retry_kwargs={"max_retries": 3, "countdown": 30},
#     retry_backoff=True,
#     name="profiles.send_weekly_insight_email",
# )
# def send_weekly_insight_email(self, email: str, insight: str):
#     """
#     Sends weekly mental health insight email
#     """
#     try:
#         send_mail(
#             "Your Weekly Mental Health Insight",
#             insight,
#             settings.DEFAULT_FROM_EMAIL,
#             [email],
#             fail_silently=False,
#         )

#         logger.info(f"Weekly insight email sent to {email}")
#         return True

#     except Exception as exc:
#         logger.error(f"Weekly insight email failed: {exc}")
#         raise self.retry(exc=exc)


# # 🔥 NEW: CONSUME HIGH-RISK ALERTS FROM RABBITMQ
# @shared_task(
#     bind=True,
#     autoretry_for=(Exception,),
#     retry_kwargs={"max_retries": 5, "countdown": 10},
#     retry_backoff=True,
#     name="profiles.handle_high_risk_alert",
# )
# def handle_high_risk_alert(self, message: str):
#     """
#     Handles CRITICAL mental health alerts from medical_service
#     """
#     try:
#         data = json.loads(message)

#         logger.critical(
#             f"🚨 HIGH RISK ALERT | user={data.get('user_id')} "
#             f"score={data.get('score')} level={data.get('level')}"
#         )

#         # Next phases:
#         # - notify admin
#         # - notify assigned doctor
#         # - emergency escalation

#         return True

#     except Exception as exc:
#         logger.error(f"High-risk alert handling failed: {exc}")
#         raise self.retry(exc=exc)


# @shared_task(name="profiles.healthcheck")
# def celery_healthcheck():
#     """
#     Confirms Celery worker is alive
#     """
#     return "CELERY OK"
