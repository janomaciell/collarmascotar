from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from .models import Pet, Scan
from .serializers import PetSerializer, PetPublicSerializer, UserSerializer, ScanSerializer
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
# views.py
class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Pet.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        pet = self.get_object()
        serializer = self.get_serializer(pet, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_pet_public_info(request, uuid):
    pet = get_object_or_404(Pet, qr_uuid=uuid)
    serializer = PetPublicSerializer(pet)
    return Response(serializer.data)



@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def record_scan(request, uuid):
    """Registra un escaneo y envía una notificación mejorada por email al dueño"""
    pet = get_object_or_404(Pet, qr_uuid=uuid)
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    if not latitude or not longitude:
        return Response({"error": "Ubicación requerida"}, status=status.HTTP_400_BAD_REQUEST)

    # Crear registro de escaneo
    scan = Scan.objects.create(
        pet=pet,
        latitude=latitude,
        longitude=longitude
    )

    # Crear enlace de Google Maps
    google_maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"

    # Detalles del escaneo
    scan_time = timezone.now().strftime('%Y-%m-%d %H:%M:%S')  # Hora local
    pet_name = pet.name
    
    # Contenido del correo en HTML
    subject = f"¡Alguien escaneó el QR de {pet_name}!"
    html_message = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #4CAF50;">¡Tu mascota {pet_name} ha sido encontrada!</h2>
        <p>Hola,</p>
        <p>Alguien acaba de escanear el QR de tu mascota. Aquí están los detalles:</p>
        <ul>
          <li><strong>Mascota:</strong> {pet_name}</li>
          <li><strong>Fecha y hora:</strong> {scan_time}</li>
          <li><strong>Ubicación:</strong> <a href="{google_maps_link}" style="color: #1a73e8; text-decoration: none;">Ver en Google Maps</a></li>
        </ul>
        <p>Si necesitas más información, revisa el historial de escaneos en tu cuenta.</p>
        <p style="font-size: 0.9em; color: #777;">Este es un mensaje automático, por favor no respondas directamente.</p>
      </body>
    </html>
    """

    plain_message = f"""
    ¡Tu mascota {pet_name} ha sido encontrada!
    Fecha y hora: {scan_time}
    Ubicación: {google_maps_link}
    Revisa el historial de escaneos en tu cuenta para más detalles.
    """

    # Enviar email al dueño
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [pet.owner.email]

    send_mail(
        subject=subject,
        message=plain_message,  # Versión en texto plano
        from_email=from_email,
        recipient_list=recipient_list,
        html_message=html_message,  # Versión HTML
        fail_silently=False,
    )

    return Response({"message": "Escaneo registrado y notificación enviada"}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_scan_history(request, pet_id):
    pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
    scans = pet.scans.all()
    serializer = ScanSerializer(scans, many=True)
    return Response(serializer.data)

class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.set_password(request.data['password'])
        user.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)