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
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token

# Inicializa Firebase Admin
cred = credentials.Certificate(str(settings.FIREBASE_CREDENTIALS_PATH))
default_app = initialize_app(cred, name='petqr')

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'username': user.username
        })

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
        
        if not was_lost and updated_pet.is_lost:
            updated_pet.last_seen_date = timezone.now()
            updated_pet.save()
        
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_lost_status(self, request, pk=None):
        pet = self.get_object()
        pet.is_lost = not pet.is_lost
        
        if pet.is_lost:
            pet.last_seen_date = timezone.now()
            latitude = request.data.get('latitude')
            longitude = request.data.get('longitude')
            if latitude and longitude:
                try:
                    alert = LostPetAlert.objects.create(
                        pet=pet,
                        owner_latitude=float(latitude),
                        owner_longitude=float(longitude),
                        radius_km=int(request.data.get('radiusKm', 50))
                    )
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
    pet = get_object_or_404(Pet, qr_uuid=uuid)
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    if not latitude or not longitude:
        return Response({"error": "Ubicación requerida"}, status=status.HTTP_400_BAD_REQUEST)

    scan = Scan.objects.create(
        pet=pet,
        latitude=latitude,
        longitude=longitude
    )

    google_maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"
    scan_time = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
    pet_name = pet.name
    
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
    plain_message = f"¡Tu mascota {pet_name} ha sido encontrada!\nFecha y hora: {scan_time}\nUbicación: {google_maps_link}\nRevisa el historial de escaneos en tu cuenta."

    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[pet.owner.email],
        html_message=html_message,
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
    try:
        serializer = DeviceRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            # Actualizar o crear el registro
            device, created = DeviceRegistration.objects.update_or_create(
                user=request.user,
                registration_id=serializer.validated_data['registration_id'],
                defaults={
                    'device_type': serializer.validated_data['device_type']
                }
            )
            
            return Response({
                'message': 'Device registered successfully',
                'device_id': device.id
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_user_location(request):
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    radius_km = request.data.get('radiusKm', 50)
    
    if not latitude or not longitude:
        return Response({"error": "Latitude and longitude are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_location, created = UserLocation.objects.get_or_create(
            user=request.user,
            defaults={
                'latitude': float(latitude),
                'longitude': float(longitude),
                'notification_radius': int(radius_km)
            }
        )
        
        if not created:
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
    try:
        devices = DeviceRegistration.objects.filter(user=request.user)
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
    pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
    
    if not pet.is_lost:
        return Response({"error": "La mascota no está marcada como perdida"}, status=status.HTTP_400_BAD_REQUEST)
    
    poster_data = request.data.get('posterImage')
    if not poster_data:
        return Response({"error": "No se proporcionó imagen del cartel"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if 'base64,' in poster_data:
            poster_data = poster_data.split('base64,')[1]
        
        image_data = base64.b64decode(poster_data)
        poster = PosterShare.objects.create(pet=pet)
        image_name = f"lost_poster_{pet.name}_{timezone.now().strftime('%Y%m%d%H%M%S')}.png"
        poster.image.save(image_name, ContentFile(image_data), save=True)
        
        pdf_data = request.data.get('posterPdf')
        if pdf_data:
            if 'base64,' in pdf_data:
                pdf_data = pdf_data.split('base64,')[1]
            pdf_binary = base64.b64decode(pdf_data)
            pdf_name = f"lost_poster_{pet.name}_{timezone.now().strftime('%Y%m%d%H%M%S')}.pdf"
            poster.pdf_file.save(pdf_name, ContentFile(pdf_binary), save=True)
        
        share_url = request.build_absolute_uri(reverse('view-poster', args=[poster.id]))
        poster.share_url = share_url
        poster.save()
        
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
    poster = get_object_or_404(PosterShare, id=poster_id)
    poster.share_count += 1
    poster.save()
    
    pet = poster.pet
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
    return Response(context)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_community_notification(request):
    pet_id = request.data.get('petId')
    scanner_location = request.data.get('scannerLocation')
    radius_km = int(request.data.get('radiusKm', 50))
    
    if not pet_id or not scanner_location:
        return Response({"error": "Pet ID and scanner location are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    pet = get_object_or_404(Pet, id=pet_id)  # Cambiado de qr_uuid a id
    if not pet.is_lost:
        return Response({"message": "Pet is not marked as lost, no community notification sent"})
    
    try:
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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_reward(request, pet_id):
    pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
    amount = request.data.get('amount')
    description = request.data.get('description', '')
    
    if not amount:
        return Response({"error": "Monto de recompensa requerido"}, status=status.HTTP_400_BAD_REQUEST)
    
    reward, created = Reward.objects.get_or_create(
        pet=pet,
        defaults={
            'amount': amount,
            'description': description
        }
    )
    return Response(RewardSerializer(reward).data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_reward(request, pet_id):
    reward = get_object_or_404(Reward, pet_id=pet_id)
    return Response(RewardSerializer(reward).data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_points(request):
    points, created = UserPoints.objects.get_or_create(user=request.user)
    return Response(UserPointsSerializer(points).data)

class LostPetView(APIView):
    def post(self, request, *args, **kwargs):
        pet_id = request.data.get('pet_id')
        alert_data = request.data.get('alert_data')

        if not pet_id or not alert_data:
            return Response({
                "error": "Se requieren pet_id y alert_data"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            pet = Pet.objects.get(id=pet_id, owner=request.user)
            alert = LostPetAlert.objects.create(
                pet=pet,
                owner_latitude=float(alert_data['latitude']),
                owner_longitude=float(alert_data['longitude']),
                radius_km=int(alert_data.get('radius_km', 50))
            )
            pet.is_lost = True
            pet.last_seen_date = timezone.now()
            pet.save()
            recipients_count = send_lost_pet_notifications(pet, alert)
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

# Helper functions for notifications

def send_lost_pet_email(pet, email, alert):
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
    users_within_radius = []
    all_locations = UserLocation.objects.exclude(user=pet.owner)
    
    for location in all_locations:
        if location.is_within_radius(alert.owner_latitude, alert.owner_longitude, alert.radius_km):
            users_within_radius.append(location.user)
    
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

    web_devices = devices.filter(device_type='web')
    for device in web_devices:
        try:
            send_web_push_notification(
                json.loads(device.registration_id),
                notification_data
            )
        except Exception as e:
            print(f"Error sending web push: {str(e)}")

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

    for user in users_within_radius:
        try:
            if user.email:
                send_lost_pet_email(pet, user.email, alert)
        except Exception as e:
            print(f"Error sending email to {user.email}: {str(e)}")

    return len(users_within_radius)

def send_community_scan_notification(pet, latitude, longitude, radius_km=50):
    if not pet.is_lost:
        return 0
    
    users_within_radius = []
    all_locations = UserLocation.objects.exclude(user=pet.owner)
    
    for location in all_locations:
        if location.is_within_radius(latitude, longitude, radius_km):
            users_within_radius.append(location.user)
    
    devices = DeviceRegistration.objects.filter(user__in=users_within_radius)
    maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"
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
    
    for user in users_within_radius:
        try:
            if user.email:
                send_lost_pet_email(pet, user.email, None)
        except Exception as e:
            print(f"Error sending email to {user.email}: {str(e)}")
    
    web_devices = devices.filter(device_type='web')
    for device in web_devices:
        try:
            send_web_push_notification(
                json.loads(device.registration_id),
                notification_data
            )
        except Exception as e:
            print(f"Error sending web push: {str(e)}")

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

def send_web_push_notification(subscription_info, data):
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
    
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_points_history(request):
    transactions = PointTransaction.objects.filter(user=request.user)
    serializer = PointTransactionSerializer(transactions, many=True)
    return Response(serializer.data)