from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pets', views.PetViewSet, basename='pet')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.CustomAuthToken.as_view(), name='login'),
    path('pets/<uuid:uuid>/scan/', views.record_scan, name='record-scan'),
    path('pet/<uuid:uuid>/', views.get_pet_public_info, name='pet-public-info'),  # Ajustado
    path('pets/<int:pet_id>/scans/', views.get_scan_history, name='scan-history'),  # Añadido
    path('register/', views.RegisterUserView.as_view(), name='register'),
    path('device/register/', views.register_device, name='register-device'),
    path('location/update/', views.update_user_location, name='update-location'),
    path('notification/status/', views.notification_status, name='notification-status'),
    path('pets/<int:pet_id>/poster/', views.generate_lost_poster, name='generate-poster'),
    path('poster/<int:poster_id>/', views.view_shared_poster, name='view-poster'),
    path('pets/lost/', views.LostPetView.as_view(), name='lost-pet-alert'),  # Ajustado
    path('notifications/community/', views.send_community_notification, name='community-notify'),  # Ajustado
    path('rewards/create/<int:pet_id>/', views.create_reward, name='create-reward'),  # Ajustado
    path('user/points/', views.get_user_points, name='user-points'),  # Ajustado
    path('users/me/', views.get_user_profile, name='user-profile'),
    path('users/points-history/', views.get_points_history, name='points-history'),
    path('support/send-email/', views.send_support_email, name='send-support-email'),  # Nueva ruta
]