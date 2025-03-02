from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from . import views

router = DefaultRouter()
router.register(r'pets', views.PetViewSet, basename='pet')

urlpatterns = [
    path('', include(router.urls)),
    path('pet/<uuid:uuid>/', views.get_pet_public_info, name='pet-public-info'),
    path('pet/<uuid:uuid>/scan/', views.record_scan, name='record-scan'),
    path('pets/<int:pet_id>/scans/', views.get_scan_history, name='scan-history'),
    path('register/', views.RegisterUserView.as_view(), name='register'),
    path('login/', obtain_auth_token, name='api_token_auth'),
]