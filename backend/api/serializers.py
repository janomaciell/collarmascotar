from rest_framework import serializers
from .models import Pet, Scan
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class ScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scan
        fields = ['id', 'timestamp', 'latitude', 'longitude']

class PetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = ['id', 'name', 'age', 'breed', 'address', 'phone', 
                 'notes', 'qr_code', 'qr_uuid', 'created_at', 'is_lost']
        read_only_fields = ['id', 'qr_code', 'qr_uuid', 'created_at']

class PetPublicSerializer(serializers.ModelSerializer):
    """Serializer para datos públicos que verá quien escanee el QR"""
    class Meta:
        model = Pet
        fields = ['name', 'age', 'breed', 'address', 'phone', 'notes', 'is_lost']