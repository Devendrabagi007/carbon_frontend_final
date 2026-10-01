from django.urls import path
from upgrade import views as accounts
from . import views
urlpatterns = [path('',views.home,name='home'),path('login/',accounts.account,{'mode':'login'},name='login'),path('signup/',accounts.account,{'mode':'signup'},name='signup'),path('logout/',accounts.signout,name='logout'),path('api/snapshots/',views.snapshots,name='snapshots')]
