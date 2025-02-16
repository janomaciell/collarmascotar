from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pets', views.PetViewSet, basename='pet')

urlpatterns = [
    path('', include(router.urls)),
    path('pet/<uuid:uuid>/', views.get_pet_public_info, name='pet-public-info'),
    path('register/', views.RegisterUserView.as_view(), name='register'),
]