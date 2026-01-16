from django.db import models
from django.contrib.auth.models import User
import qrcode
import qrcode.image.svg
from io import BytesIO
from django.core.files import File
from django.core.files.base import ContentFile
from PIL import Image
import uuid
from django.utils import timezone
import math
from django.conf import settings


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
    qr_code_svg = models.FileField(upload_to='qr_codes_svg/', blank=True, null=True)
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
        if self.is_lost and not self.last_seen_date:
            self.last_seen_date = timezone.now()
        
        # Generar QR codes si no existen
        if not self.qr_code or not self.qr_code_svg:
            # Construir la URL del QR
            frontend_url = getattr(settings, 'FRONTEND_URL', 'https://www.encuentrameqr.com/')
            qr_url = f'{frontend_url}/qr/{self.qr_uuid}'
            
            # Generar QR code PNG (para visualización)
            qr_png = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr_png.add_data(qr_url)
            qr_png.make(fit=True)
            img_png = qr_png.make_image(fill_color="black", back_color="white")
            
            buffer_png = BytesIO()
            img_png.save(buffer_png, format='PNG')
            file_name_png = f'pet_qr_{self.qr_uuid}.png'
            self.qr_code.save(file_name_png, File(buffer_png), save=False)
            
            # Generar QR code SVG vectorizado (para impresión/grabado láser)
            factory = qrcode.image.svg.SvgPathImage
            qr_svg = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
                image_factory=factory,
            )
            qr_svg.add_data(qr_url)
            qr_svg.make(fit=True)
            img_svg = qr_svg.make_image(fill_color="black", back_color="white")
            
            buffer_svg = BytesIO()
            img_svg.save(buffer_svg)
            file_name_svg = f'pet_qr_{self.qr_uuid}.svg'
            self.qr_code_svg.save(file_name_svg, ContentFile(buffer_svg.getvalue()), save=False)
            
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ['owner', 'name']


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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    registration_id = models.CharField(max_length=500)
    device_type = models.CharField(max_length=20, choices=[
        ('web', 'Web Browser'),
        ('android', 'Android'),
        ('ios', 'iOS'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'registration_id')

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


class PreGeneratedQR(models.Model):
    qr_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    qr_code = models.ImageField(upload_to='pre_generated_qr_codes/', blank=True)
    qr_code_svg = models.FileField(upload_to='pre_generated_qr_codes_svg/', blank=True, null=True)
    is_assigned = models.BooleanField(default=False)
    is_printed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "QR Pre-generado"
        verbose_name_plural = "QRs Pre-generados"
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.qr_code or not self.qr_code_svg:
            # Construir la URL del QR
            frontend_url = getattr(settings, 'FRONTEND_URL', 'https://tupetid.com')
            qr_url = f'{frontend_url}/qr/{self.qr_uuid}'
            
            # Generar QR code PNG (para visualización en admin)
            qr_png = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr_png.add_data(qr_url)
            qr_png.make(fit=True)
            img_png = qr_png.make_image(fill_color="black", back_color="white")
            
            buffer_png = BytesIO()
            img_png.save(buffer_png, format='PNG')
            file_name_png = f'pre_qr_{self.qr_uuid}.png'
            self.qr_code.save(file_name_png, File(buffer_png), save=False)
            
            # Generar QR code SVG vectorizado (para impresión/grabado láser)
            factory = qrcode.image.svg.SvgPathImage
            qr_svg = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
                image_factory=factory,
            )
            qr_svg.add_data(qr_url)
            qr_svg.make(fit=True)
            img_svg = qr_svg.make_image(fill_color="black", back_color="white")
            
            buffer_svg = BytesIO()
            img_svg.save(buffer_svg)
            file_name_svg = f'pre_qr_{self.qr_uuid}.svg'
            self.qr_code_svg.save(file_name_svg, ContentFile(buffer_svg.getvalue()), save=False)
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        status = "Asignado" if self.is_assigned else "No asignado"
        printed = "Impreso" if self.is_printed else "No impreso"
        return f"QR {self.qr_uuid} - {status}, {printed}"