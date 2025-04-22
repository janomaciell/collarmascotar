from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pets', views.PetViewSet, basename='pet')
router.register(r'pre-generated-qrs', views.PreGeneratedQRViewSet, basename='pregeneratedqr')

urlpatterns = [
    path('pets/lost/', views.LostPetView.as_view(), name='lost-pet-alert'),
    path('', include(router.urls)),
    path('login/', views.CustomAuthToken.as_view(), name='login'),
    path('pets/<uuid:uuid>/scan/', views.record_scan, name='record-scan'),
    #path('pets/<uuid:uuid>/', views.get_pet_by_uuid, name='get_pet_by_uuid'),    
    path('pets/<int:pet_id>/scans/', views.get_scan_history, name='scan-history'),
    path('register/', views.RegisterUserView.as_view(), name='register'),
    path('device/register/', views.register_device, name='register-device'),
    path('location/update/', views.update_user_location, name='update-location'),
    path('notification/status/', views.notification_status, name='notification-status'),
    path('pets/<int:pet_id>/poster/', views.generate_lost_poster, name='generate-poster'),
    path('poster/<int:poster_id>/', views.view_shared_poster, name='view-poster'),
    path('notifications/community/', views.send_community_notification, name='community-notify'),
    path('users/me/', views.get_user_profile, name='user-profile'),
    path('support/send-email/', views.send_support_email, name='send-support-email'),
    path('check-qr/<uuid:uuid>/', views.check_qr_status,name='check-qr-status'),
    path('register-pet-to-qr/<uuid:uuid>/', views.register_pet_to_qr ,name='register-pet-to-qr'),
    path('complete-registration/', views.complete_pending_registration ,name='complete-registration'),
    path('qr/<uuid:uuid>/', views.qr_redirect, name='qr-redirect'),
    path('pets/uuid/<str:uuid>/', views.get_pet_by_uuid, name='get-pet-by-uuid'),
]