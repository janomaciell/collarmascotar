# serializers.py (update)

from rest_framework import serializers
from .models import Pet, Scan, UserLocation, DeviceRegistration, PosterShare, LostPetAlert
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
        extra_kwargs = {'password': {'write_only': True}}
        read_only_fields = ['id']

class ScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scan
        fields = ['id', 'timestamp', 'latitude', 'longitude']

class PetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = ['id', 'name', 'age', 'breed', 'address', 'phone', 
                 'notes', 'qr_code', 'qr_uuid', 'created_at', 'is_lost',
                 'last_seen_date', 'last_location', 'photo']
        read_only_fields = ['id', 'qr_code', 'qr_uuid', 'created_at']

class PetPublicSerializer(serializers.ModelSerializer):
    """Serializer para datos públicos que verá quien escanee el QR"""
    class Meta:
        model = Pet
        fields = ['name', 'age', 'breed', 'address', 'phone', 'notes', 'is_lost',
                 'last_seen_date', 'photo']

class UserLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLocation
        fields = ['latitude', 'longitude', 'notification_radius', 'updated_at']
        read_only_fields = ['updated_at']

class DeviceRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceRegistration
        fields = ['registration_id', 'device_type']

class PosterShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = PosterShare
        fields = ['id', 'image', 'pdf_file', 'share_url', 'share_count', 'created_at']
        read_only_fields = ['id', 'share_url', 'share_count', 'created_at']

class LostPetAlertSerializer(serializers.ModelSerializer):
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    
    class Meta:
        model = LostPetAlert
        fields = ['id', 'pet', 'pet_name', 'owner_latitude', 'owner_longitude',
                 'radius_km', 'recipients_count', 'sent_at']
        read_only_fields = ['id', 'recipients_count', 'sent_at']