# models.py (update to add notification models)

from django.db import models
from django.contrib.auth.models import User
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image
import uuid
from django.utils import timezone
import math

class Pet(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    breed = models.CharField(max_length=100, blank=True)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    notes = models.TextField(blank=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True)
    qr_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_lost = models.BooleanField(default=False)
    last_seen_date = models.DateTimeField(null=True, blank=True)
    last_location = models.CharField(max_length=255, blank=True, null=True)
    photo = models.ImageField(upload_to='pet_photos/', null=True, blank=True)
    
    # Campos de salud
    allergies = models.TextField(blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True)
    blood_type = models.CharField(max_length=10, blank=True, null=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    
    # Información de identificación
    microchip_id = models.CharField(max_length=50, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    gender = models.CharField(
        max_length=1, 
        choices=[('M', 'Macho'), ('F', 'Hembra')],
        blank=True, 
        null=True
    )
    
    # Estado de esterilización
    is_sterilized = models.BooleanField(default=False)
    sterilization_date = models.DateField(blank=True, null=True)
    
    # Información del veterinario
    vet_name = models.CharField(max_length=100, blank=True, null=True)
    vet_phone = models.CharField(max_length=20, blank=True, null=True)
    vet_address = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.qr_code:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(f'http://localhost:3000/pet/{self.qr_uuid}')
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            self.qr_code.save(f'qr_{self.name}_{self.qr_uuid}.png', File(buffer), save=False)
        
        # If setting as lost for the first time, update last_seen_date
        if self.is_lost and not self.last_seen_date:
            self.last_seen_date = timezone.now()
            
        super().save(*args, **kwargs)

class Scan(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='scans')
    timestamp = models.DateTimeField(auto_now_add=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    def __str__(self):
        return f"Scan de {self.pet.name} el {self.timestamp}"

class UserLocation(models.Model):
    """Model to store user's location for notifications"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='location')
    latitude = models.FloatField()
    longitude = models.FloatField()
    notification_radius = models.IntegerField(default=50)  # radius in km
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Location for {self.user.username}"
    
    def is_within_radius(self, lat, lon, radius_km=None):
        """Check if a location is within user's notification radius"""
        if radius_km is None:
            radius_km = self.notification_radius
            
        # Calculate distance using Haversine formula
        R = 6371  # Earth's radius in km
        
        lat1_rad = math.radians(self.latitude)
        lon1_rad = math.radians(self.longitude)
        lat2_rad = math.radians(lat)
        lon2_rad = math.radians(lon)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat/2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance <= radius_km

class DeviceRegistration(models.Model):
    """Model to store push notification device registrations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    registration_id = models.CharField(max_length=500)  # Quitamos unique=True
    device_type = models.CharField(max_length=20, choices=[
        ('web', 'Web Browser'),
        ('android', 'Android'),
        ('ios', 'iOS'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['registration_id'], name='reg_id_idx')
        ]
        constraints = [
            models.UniqueConstraint(fields=['registration_id'], name='unique_registration')
        ]
    
    def __str__(self):
        return f"{self.device_type} device for {self.user.username}"

class PosterShare(models.Model):
    """Model to store lost pet posters for sharing"""
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='posters')
    image = models.ImageField(upload_to='lost_posters/')
    pdf_file = models.FileField(upload_to='lost_posters/pdf/', blank=True, null=True)
    share_url = models.URLField(blank=True)
    share_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Poster for {self.pet.name}"

class LostPetAlert(models.Model):
    """Model to store records of lost pet alerts sent"""
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='alerts')
    owner_latitude = models.FloatField()
    owner_longitude = models.FloatField()
    radius_km = models.IntegerField(default=50)
    recipients_count = models.IntegerField(default=0)
    sent_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Alert for {self.pet.name} at {self.sent_at}"