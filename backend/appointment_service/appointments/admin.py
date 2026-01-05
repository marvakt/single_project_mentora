from django.contrib import admin

from .models import Appointment, Payment, VideoSession

admin.site.register(Appointment)
admin.site.register(Payment)
admin.site.register(VideoSession)
