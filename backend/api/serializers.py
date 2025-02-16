from rest_framework import serializers
from .models import Pet
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class PetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = ['id', 'name', 'age', 'breed', 'address', 'phone', 
                 'notes', 'qr_code', 'qr_uuid', 'created_at']
        read_only_fields = ['id', 'qr_code', 'qr_uuid', 'created_at']

class PetPublicSerializer(serializers.ModelSerializer):
    """Serializer para datos públicos que verá quien escanee el QR"""
    class Meta:
        model = Pet
        fields = ['name', 'age', 'breed', 'address', 'phone', 'notes']