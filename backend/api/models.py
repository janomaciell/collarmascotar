from django.db import models
from django.contrib.auth.models import User
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image
import uuid

class Pet(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    breed = models.CharField(max_length=100, blank=True)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True)
    qr_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        # Generar QR si no existe
        if not self.qr_code:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            # URL donde se mostrará la información del perro
            qr.add_data(f'http://localhost:3000/pet/{self.qr_uuid}')
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            self.qr_code.save(f'qr_{self.name}_{self.qr_uuid}.png', 
                             File(buffer), save=False)
        
        super().save(*args, **kwargs)