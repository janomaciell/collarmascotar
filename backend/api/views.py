from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from django.shortcuts import get_object_or_404
from .models import *
from .serializers import *
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils import timezone
from django.urls import reverse
from pywebpush import webpush
import json
import base64
from rest_framework.views import APIView
from firebase_admin import credentials, initialize_app, messaging
from django.conf import settings

# Inicializa Firebase Admin
cred = credentials.Certificate(str(settings.FIREBASE_CREDENTIALS_PATH))
default_app = initialize_app(cred, name='petqr')

class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Pet.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        pet = self.get_object()
        was_lost = pet.is_lost
        serializer = self.get_serializer(pet, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_pet = serializer.save()
        
        # If pet status changed to lost, update last_seen_date
        if not was_lost and updated_pet.is_lost:
            updated_pet.last_seen_date = timezone.now()
            updated_pet.save()
        
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_lost_status(self, request, pk=None):
        pet = self.get_object()
        pet.is_lost = not pet.is_lost
        
        # If changing to lost status, update last seen date
        if pet.is_lost:
            pet.last_seen_date = timezone.now()
            
            # Get owner's location if provided
            latitude = request.data.get('latitude')
            longitude = request.data.get('longitude')
            if latitude and longitude:
                try:
                    # Create lost pet alert
                    alert = LostPetAlert.objects.create(
                        pet=pet,
                        owner_latitude=float(latitude),
                        owner_longitude=float(longitude),
                        radius_km=int(request.data.get('radiusKm', 50))
                    )
                    
                    # Send notifications to nearby users
                    recipients = send_lost_pet_notifications(pet, alert)
                    alert.recipients_count = recipients
                    alert.save()
                    
                except Exception as e:
                    print(f"Error sending lost pet notifications: {str(e)}")
        
        pet.save()
        return Response(self.get_serializer(pet).data)

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

    if pet.is_lost:
        try:
            recipients = send_community_scan_notification(pet, latitude, longitude)
            print(f"Community notifications sent to {recipients} users")
        except Exception as e:
            print(f"Error sending community notification: {str(e)}")

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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def register_device(request):
    """Register a device for push notifications"""
    serializer = DeviceRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        # Check if the registration_id already exists
        registration_id = serializer.validated_data['registration_id']
        device_type = serializer.validated_data['device_type']
        
        try:
            device = DeviceRegistration.objects.get(registration_id=registration_id)
            # Update the device if it exists
            device.user = request.user
            device.device_type = device_type
            device.save()
        except DeviceRegistration.DoesNotExist:
            # Create new device
            DeviceRegistration.objects.create(
                user=request.user,
                registration_id=registration_id,
                device_type=device_type
            )
        
        return Response({"message": "Device registered successfully"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_user_location(request):
    """Update user location for notifications"""
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    radius_km = request.data.get('radiusKm', 50)
    
    if not latitude or not longitude:
        return Response({"error": "Latitude and longitude are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get or create user location
        user_location, created = UserLocation.objects.get_or_create(
            user=request.user,
            defaults={
                'latitude': float(latitude),
                'longitude': float(longitude),
                'notification_radius': int(radius_km)
            }
        )
        
        if not created:
            # Update existing location
            user_location.latitude = float(latitude)
            user_location.longitude = float(longitude)
            user_location.notification_radius = int(radius_km)
            user_location.save()
        
        return Response({
            "message": "Location updated successfully",
            "location": UserLocationSerializer(user_location).data
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_status(request):
    """Get user's notification status and preferences"""
    try:
        # Check if user has registered devices
        devices = DeviceRegistration.objects.filter(user=request.user)
        
        # Check if user has location set
        try:
            location = UserLocation.objects.get(user=request.user)
            location_data = UserLocationSerializer(location).data
        except UserLocation.DoesNotExist:
            location_data = None
        
        return Response({
            "isSubscribed": devices.exists(),
            "devicesCount": devices.count(),
            "location": location_data,
            "radius": location_data['notification_radius'] if location_data else 50
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_lost_poster(request, pet_id):
    """Generate and save a lost pet poster"""
    pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
    
    if not pet.is_lost:
        return Response({"error": "La mascota no está marcada como perdida"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get poster image from request (should be base64 encoded)
    poster_data = request.data.get('posterImage')
    if not poster_data:
        return Response({"error": "No se proporcionó imagen del cartel"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Remove data:image/png;base64, prefix if present
        if 'base64,' in poster_data:
            poster_data = poster_data.split('base64,')[1]
        
        # Decode base64 to image
        image_data = base64.b64decode(poster_data)
        
        # Create poster record
        poster = PosterShare.objects.create(pet=pet)
        
        # Save image
        image_name = f"lost_poster_{pet.name}_{timezone.now().strftime('%Y%m%d%H%M%S')}.png"
        poster.image.save(image_name, ContentFile(image_data), save=True)
        
        # If PDF data provided, save it too
        pdf_data = request.data.get('posterPdf')
        if pdf_data:
            if 'base64,' in pdf_data:
                pdf_data = pdf_data.split('base64,')[1]
            
            pdf_binary = base64.b64decode(pdf_data)
            pdf_name = f"lost_poster_{pet.name}_{timezone.now().strftime('%Y%m%d%H%M%S')}.pdf"
            poster.pdf_file.save(pdf_name, ContentFile(pdf_binary), save=True)
        
        # Generate a shareable URL
        share_url = request.build_absolute_uri(reverse('poster-share', args=[poster.id]))
        poster.share_url = share_url
        poster.save()
        
        print(f"Ruta de la foto guardada: {pet.photo.path}")
        print(f"URL de la foto: {pet.photo.url}")
        
        return Response({
            "id": poster.id,
            "imageUrl": request.build_absolute_uri(poster.image.url),
            "pdfUrl": request.build_absolute_uri(poster.pdf_file.url) if poster.pdf_file else None,
            "shareUrl": share_url
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def view_shared_poster(request, poster_id):
    """View a shared lost pet poster"""
    poster = get_object_or_404(PosterShare, id=poster_id)
    
    # Increment share count when viewed
    poster.share_count += 1
    poster.save()
    
    # Get pet details
    pet = poster.pet
    
    # Prepare data for the sharing page
    context = {
        "poster": {
            "imageUrl": request.build_absolute_uri(poster.image.url),
            "pdfUrl": request.build_absolute_uri(poster.pdf_file.url) if poster.pdf_file else None,
        },
        "pet": {
            "name": pet.name,
            "breed": pet.breed,
            "age": pet.age,
            "lastSeen": pet.last_seen_date.strftime('%Y-%m-%d %H:%M:%S') if pet.last_seen_date else None,
            "lastLocation": pet.last_location,
            "contactPhone": pet.phone,
            "qrCode": request.build_absolute_uri(pet.qr_code.url) if pet.qr_code else None,
        }
    }
    
    # For API view, return JSON
    return Response(context)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_lost_pet_alert(request):
    """Send lost pet alert to nearby users"""
    pet_id = request.data.get('petId')
    owner_location = request.data.get('ownerLocation')
    radius_km = int(request.data.get('radiusKm', 50))
    
    if not pet_id or not owner_location:
        return Response({"error": "Pet ID and owner location are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
    
    if not pet.is_lost:
        return Response({"error": "La mascota no está marcada como perdida"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Create lost pet alert record
        alert = LostPetAlert.objects.create(
            pet=pet,
            owner_latitude=owner_location['latitude'],
            owner_longitude=owner_location['longitude'],
            radius_km=radius_km
        )
        
        # Send notifications to nearby users
        recipients_count = send_lost_pet_notifications(pet, alert)
        
        # Update alert with recipients count
        alert.recipients_count = recipients_count
        alert.save()
        
        return Response({
            "message": "Alerta enviada correctamente",
            "recipients": recipients_count,
            "alertId": alert.id
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_community_notification(request):
    """Send notification to community when pet is scanned"""
    pet_id = request.data.get('petId')
    scanner_location = request.data.get('scannerLocation')
    radius_km = int(request.data.get('radiusKm', 50))
    
    if not pet_id or not scanner_location:
        return Response({"error": "Pet ID and scanner location are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    pet = get_object_or_404(Pet, qr_uuid=pet_id)
    
    if not pet.is_lost:
        return Response({"message": "Pet is not marked as lost, no community notification sent"})
    
    try:
        # Send notifications to nearby users
        recipients_count = send_community_scan_notification(
            pet, 
            scanner_location['latitude'], 
            scanner_location['longitude'],
            radius_km
        )
        
        return Response({
            "message": "Community notification sent",
            "recipients": recipients_count
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Helper functions for notifications

def send_lost_pet_email(pet, email, alert):
    """Send an email notification about a lost pet"""
    subject = f"¡Mascota perdida: {pet.name}!"
    message = f"""
    Hola,

    Se ha reportado que {pet.name} está perdido cerca de tu área. Por favor, mantén un ojo abierto y si lo ves, escanea su código QR o contacta al dueño.

    Detalles de la mascota:
    - Nombre: {pet.name}
    - Raza: {pet.breed}
    - Última ubicación conocida: {alert.owner_latitude}, {alert.owner_longitude}

    Gracias por tu ayuda.
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])

def send_lost_pet_notifications(pet, alert):
    """Send notifications to users within a radius using Firebase Admin SDK and Web Push"""
    users_within_radius = []
    all_locations = UserLocation.objects.exclude(user=pet.owner)
    
    for location in all_locations:
        if location.is_within_radius(alert.owner_latitude, alert.owner_longitude, alert.radius_km):
            users_within_radius.append(location.user)
    
    # Get devices for users within radius
    devices = DeviceRegistration.objects.filter(user__in=users_within_radius)
    
    notification_data = {
        "title": f"¡Mascota perdida cerca de ti!",
        "body": f"{pet.name} se ha perdido. Si lo ves, escanea su código QR o contacta al dueño.",
        "icon": pet.photo.url if pet.photo else None,
        "click_action": f"/lost-pet/{pet.id}",
        "data": {
            "petId": str(pet.id),
            "petName": pet.name,
            "petBreed": pet.breed,
            "ownerPhone": pet.phone,
            "alertId": str(alert.id)
        }
    }

    # Send web push notifications
    web_devices = devices.filter(device_type='web')
    for device in web_devices:
        try:
            send_web_push_notification(
                json.loads(device.registration_id),
                notification_data
            )
        except Exception as e:
            print(f"Error sending web push: {str(e)}")

    # Send FCM notifications using Firebase Admin SDK
    mobile_tokens = list(devices.exclude(device_type='web').values_list('registration_id', flat=True))
    if mobile_tokens:
        try:
            send_fcm_notification(
                tokens=mobile_tokens,
                title=notification_data['title'],
                body=notification_data['body'],
                data=notification_data['data']
            )
        except Exception as e:
            print(f"Error sending FCM notifications: {str(e)}")

    # Send email notifications to users within radius
    for user in users_within_radius:
        try:
            if user.email:
                send_lost_pet_email(pet, user.email, alert)
        except Exception as e:
            print(f"Error sending email to {user.email}: {str(e)}")

    return len(users_within_radius)

def send_community_scan_notification(pet, latitude, longitude, radius_km=50):
    """Send notifications to community when a lost pet is scanned using Firebase Admin SDK and Web Push"""
    if not pet.is_lost:
        return 0  # Skip if pet is not lost
    
    # Get all user locations within the radius
    users_within_radius = []
    
    all_locations = UserLocation.objects.exclude(user=pet.owner)
    
    for location in all_locations:
        if location.is_within_radius(latitude, longitude, radius_km):
            users_within_radius.append(location.user)
    
    # Get devices for users within radius
    devices = DeviceRegistration.objects.filter(user__in=users_within_radius)
    
    # Create Google Maps link for the location
    maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"
    
    # Prepare notification data
    notification_data = {
        "title": f"¡{pet.name} ha sido visto cerca de ti!",
        "body": f"Alguien acaba de escanear el QR de {pet.name}, una mascota perdida, cerca de tu ubicación.",
        "icon": pet.photo.url if pet.photo else None,
        "click_action": f"/found-pet/{pet.qr_uuid}",
        "data": {
            "petId": str(pet.id),
            "petName": pet.name,
            "petBreed": pet.breed,
            "mapsLink": maps_link
        }
    }
    
    # Send email notifications
    for user in users_within_radius:
        try:
            if user.email:
                send_lost_pet_email(pet, user.email, None)
        except Exception as e:
            print(f"Error sending email to {user.email}: {str(e)}")
    
    # Send web push notifications
    web_devices = devices.filter(device_type='web')
    for device in web_devices:
        try:
            send_web_push_notification(
                json.loads(device.registration_id),
                notification_data
            )
        except Exception as e:
            print(f"Error sending web push: {str(e)}")

    # Send FCM notifications using Firebase Admin SDK
    mobile_tokens = list(devices.exclude(device_type='web').values_list('registration_id', flat=True))
    if mobile_tokens:
        try:
            send_fcm_notification(
                tokens=mobile_tokens,
                title=notification_data['title'],
                body=notification_data['body'],
                data=notification_data['data']
            )
        except Exception as e:
            print(f"Error sending FCM notifications: {str(e)}")

    return len(users_within_radius)

class LostPetView(APIView):
    """Vista para manejar el reporte de una mascota perdida."""

    def post(self, request, *args, **kwargs):
        """Recibe la alerta de mascota perdida y envía notificaciones a los usuarios cercanos."""
        pet_id = request.data.get('pet_id')
        alert_data = request.data.get('alert_data')

        if not pet_id or not alert_data:
            return Response({
                "error": "Se requieren pet_id y alert_data"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Obtener la mascota y validar que pertenezca al usuario
            pet = Pet.objects.get(id=pet_id, owner=request.user)
            
            # Crear alerta
            alert = LostPetAlert.objects.create(
                pet=pet,
                owner_latitude=float(alert_data['latitude']),
                owner_longitude=float(alert_data['longitude']),
                radius_km=int(alert_data.get('radius_km', 50))
            )

            # Actualizar estado de la mascota
            pet.is_lost = True
            pet.last_seen_date = timezone.now()
            pet.save()

            # Enviar notificaciones
            recipients_count = send_lost_pet_notifications(pet, alert)
            
            # Actualizar contador de destinatarios
            alert.recipients_count = recipients_count
            alert.save()

            return Response({
                "message": f"Alerta enviada a {recipients_count} usuarios cercanos",
                "alert_id": alert.id,
                "pet_status": "lost"
            }, status=status.HTTP_200_OK)

        except Pet.DoesNotExist:
            return Response({
                "error": "Mascota no encontrada o no pertenece al usuario"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                "error": f"Error procesando la alerta: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def send_web_push_notification(subscription_info, data):
    """
    Envía una notificación web push a un navegador
    """
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(data),
            vapid_private_key=settings.WEBPUSH_SETTINGS['VAPID_PRIVATE_KEY'],
            vapid_claims={
                "sub": f"mailto:{settings.WEBPUSH_SETTINGS['VAPID_ADMIN_EMAIL']}"
            }
        )
        return True
    except Exception as e:
        print(f"Error sending web push notification: {str(e)}")
        return False

def send_fcm_notification(tokens, title, body, data=None):
    """
    Envía una notificación usando Firebase Cloud Messaging con Firebase Admin SDK
    """
    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
        )
        
        response = messaging.send_multicast(message)
        print(f"FCM notifications sent successfully: {response.success_count} successes, {response.failure_count} failures")
        return response
    except Exception as e:
        print(f"Error sending FCM notification: {str(e)}")
        raise