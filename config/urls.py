from django.urls import path
from calculator.views import home, snapshots

urlpatterns = [
    path("", home, name="home"),
    path("api/snapshots/", snapshots, name="snapshots"),
]
