from django.conf import settings
from django.db import models

class Snapshot(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    total_kg = models.FloatField()
    scenario_kg = models.FloatField()
    inputs = models.JSONField(default=dict)

class LoginAttempt(models.Model):
    key = models.CharField(max_length=64, unique=True)
    failures = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField()
