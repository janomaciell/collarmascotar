# serializers.py (update)

from rest_framework import serializers
from .models import *
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
        fields = [
            'id', 
            'name', 
            'age', 
            'breed', 
            'address', 
            'phone',
            'email',
            'notes', 
            'qr_code', 
            'qr_uuid', 
            'created_at', 
            'is_lost',
            'last_seen_date', 
            'last_location', 
            'photo',
            # Campos de salud
            'allergies',
            'medical_conditions',
            'blood_type',
            'weight',
            # Información de identificación
            'microchip_id',
            'birth_date',
            'gender',
            # Estado de esterilización
            'is_sterilized',
            'sterilization_date',
            # Información del veterinario
            'vet_name',
            'vet_phone',
            'vet_address'
        ]
        read_only_fields = ['id', 'qr_code', 'qr_uuid', 'created_at']
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Log de los campos requeridos
        print("Campos requeridos en el serializer:")
        for field_name, field in self.fields.items():
            print(f"{field_name}: required={field.required}")
    
    def validate_photo(self, value):
        if value and len(value.name) > 100:
            extension = value.name.split('.')[-1]
            base_name = value.name[:95 - len(extension)]
            value.name = f"{base_name}.{extension}"
            print(f"Nombre de archivo truncado a: {value.name}")
        return value

class PetPublicSerializer(serializers.ModelSerializer):
    """Serializer para datos públicos que verá quien escanee el QR"""
    class Meta:
        model = Pet
        fields = [
            'name', 
            'age', 
            'breed', 
            'address', 
            'phone',
            'email', 
            'notes', 
            'is_lost',
            'last_seen_date', 
            'photo',
            'allergies',
            'medical_conditions',
            'gender',
            'is_sterilized',
            'vet_name',
            'vet_phone'
        ]

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


class PreGeneratedQRSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreGeneratedQR
        fields = ['id', 'qr_uuid', 'qr_code', 'is_assigned', 'is_printed', 'created_at']
        read_only_fields = ['id', 'qr_uuid', 'qr_code', 'created_at']