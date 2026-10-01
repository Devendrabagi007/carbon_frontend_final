from django.urls import path
from . import views
urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.account, {'mode':'login'}, name='login'),
    path('signup/', views.account, {'mode':'signup'}, name='signup'),
    path('logout/', views.signout, name='logout'),
    path('api/snapshots/', views.snapshots, name='snapshots'),
]
