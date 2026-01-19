from rest_framework import viewsets, permissions, generics, status
from rest_framework.permissions import AllowAny
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
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from pywebpush import webpush
import json
import base64
import traceback
import logging
from rest_framework.views import APIView
from firebase_admin import credentials, initialize_app, messaging
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token



# Inicializa Firebase Admin
cred = credentials.Certificate(str(settings.FIREBASE_CREDENTIALS_PATH))
default_app = initialize_app(cred, name='petqr')



class CustomAuthToken(ObtainAuthToken):
    serializer_class = EmailAuthTokenSerializer
    
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
    
    def create(self, request, *args, **kwargs):
        # Verificar si ya existe una mascota con el mismo nombre para este usuario
        name = request.data.get('name')
        existing_pet = Pet.objects.filter(
            owner=request.user,
            name=name
        ).first()
        
        if (existing_pet):
            # Si la mascota ya existe, retornar error
            return Response(
                {"error": f"Ya tienes una mascota registrada con el nombre {name}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Si no existe, crear la nueva mascota
        response = super().create(request, *args, **kwargs)
        
        # Agregar un pequeño delay para evitar múltiples solicitudes
        from time import sleep
        sleep(0.5)
        
        return response
    
    def perform_create(self, serializer):
        # Verificar si ya existe un QR code similar
        qr_code = serializer.validated_data.get('qr_code')
        if qr_code and Pet.objects.filter(qr_code=qr_code).exists():
            raise serializers.ValidationError("Este código QR ya está en uso")
            
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
@permission_classes([AllowAny])
def get_pet_by_uuid(request, uuid):
  try:
    pet = Pet.objects.get(qr_uuid=uuid)
    serializer = PetSerializer(pet)
    return Response({
      'status': 'success',
      'data': serializer.data
    })
  except Pet.DoesNotExist:
    return Response({
      'status': 'error',
      'message': 'Mascota no encontrada'
    }, status=status.HTTP_404_NOT_FOUND)
  except ValueError as e:
    return Response({
      'status': 'error',
      'message': f'Invalid UUID format: {str(e)}'
    }, status=status.HTTP_400_BAD_REQUEST)
  except Exception as e:
    return Response({
      'status': 'error',
      'message': str(e)
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def record_scan(request, uuid):
    """
    Endpoint para notificar al dueño cuando alguien escanea el QR
    """
    logger = logging.getLogger('api')
    try:
        # Log para debugging (usar logger en producción, print en desarrollo)
        if settings.DEBUG:
            print(f"[SCAN] Request recibido para UUID: {uuid}")
            print(f"[SCAN] Content-Type: {request.content_type}")
            print(f"[SCAN] Request data: {request.data}")
        else:
            logger.info(f"[SCAN] Request recibido para UUID: {uuid}")
        
        pet = get_object_or_404(Pet, qr_uuid=uuid)
        
        # Obtener ubicación del request
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if settings.DEBUG:
            print(f"[SCAN] Latitude recibida: {latitude} (tipo: {type(latitude)})")
            print(f"[SCAN] Longitude recibida: {longitude} (tipo: {type(longitude)})")
        
        if not latitude or not longitude:
            error_msg = f"[SCAN ERROR] Faltan coordenadas - latitude: {latitude}, longitude: {longitude}"
            if settings.DEBUG:
                print(error_msg)
            else:
                logger.warning(error_msg)
            return Response(
                {"error": "Se requiere latitude y longitude"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convertir a float si es necesario
        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (ValueError, TypeError) as e:
            error_msg = f"[SCAN ERROR] Error convirtiendo coordenadas a float: {str(e)}"
            if settings.DEBUG:
                print(error_msg)
            else:
                logger.error(error_msg)
            return Response(
                {"error": f"Coordenadas inválidas: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

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
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Encabezado -->
            <div style="background-color: #05408F; padding: 20px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px;">¡Alguien escaneó el QR de {pet_name}!</h1>
            </div>
            
            <!-- Contenido -->
            <div style="padding: 25px; color: #333;">
                <h2 style="color: #4CAF50; margin-top: 0;">🐾 ¡Tu mascota {pet_name} ha sido encontrada!</h2>
                <p>Hola,</p>
                <p>Acaban de escanear el QR de tu mascota. Aquí están los detalles:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr>
                    <td style="padding: 8px; font-weight: bold;">🐶 Mascota:</td>
                    <td style="padding: 8px;">{pet_name}</td>
                </tr>
                <tr style="background-color: #f4f4f4;">
                    <td style="padding: 8px; font-weight: bold;">📅 Fecha y hora:</td>
                    <td style="padding: 8px;">{scan_time}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">📍 Ubicación:</td>
                    <td style="padding: 8px;">
                    <a href="{google_maps_link}" style="color: #05408F; font-weight: bold; text-decoration: none;">Ver en Google Maps</a>
                    </td>
                </tr>
                </table>
                
                <p style="margin-top: 20px;">🔎 Para más información, revisa el historial de escaneos en tu cuenta.</p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #777;">
                <p>Este es un mensaje automático de <strong>Encuéntrame</strong>. Por favor, no respondas directamente.</p>
            </div>
            </div>
        </body>
        </html>
        """

        plain_message = f"¡Tu mascota {pet_name} ha sido encontrada!\nFecha y hora: {scan_time}\nUbicación: {google_maps_link}\nRevisa el historial de escaneos en tu cuenta."

        # Enviar email con manejo de errores
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[pet.owner.email],
                html_message=html_message,
                fail_silently=False,
            )
            if settings.DEBUG:
                print(f"✓ Email enviado exitosamente a {pet.owner.email} para mascota {pet_name}")
            else:
                logger.info(f"Email enviado exitosamente a {pet.owner.email} para mascota {pet_name}")
        except Exception as e:
            # Log del error pero continuar con el proceso
            error_details = str(e)
            error_traceback = traceback.format_exc()
            if settings.DEBUG:
                print(f"⚠️ ERROR al enviar email a {pet.owner.email}: {error_details}")
                print(f"⚠️ Traceback: {error_traceback}")
            else:
                logger.error(f"Error enviando email de escaneo QR: {error_details}")
                logger.error(f"Traceback completo: {error_traceback}")

        if pet.is_lost:
            try:
                recipients = send_community_scan_notification(pet, latitude, longitude)
                if settings.DEBUG:
                    print(f"Community notifications sent to {recipients} users")
                else:
                    logger.info(f"Community notifications sent to {recipients} users")
            except Exception as e:
                error_msg = f"Error sending community notification: {str(e)}"
                if settings.DEBUG:
                    print(error_msg)
                else:
                    logger.error(error_msg)

        return Response({"message": "Escaneo registrado y notificación enviada"}, status=status.HTTP_201_CREATED)
        
    except json.JSONDecodeError as e:
        error_msg = f"[SCAN ERROR] JSON decode error: {str(e)}"
        if settings.DEBUG:
            print(error_msg)
        else:
            logger.error(error_msg)
        return Response(
            {'error': f'JSON inválido: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        error_msg = f"[SCAN ERROR] Error general: {str(e)}"
        error_traceback = traceback.format_exc()
        if settings.DEBUG:
            print(error_msg)
            print(f"[SCAN ERROR] Traceback: {error_traceback}")
        else:
            logger.error(error_msg)
            logger.error(f"Traceback: {error_traceback}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        print("Datos recibidos:", request.data)
        return Response({"error": "No se proporcionó imagen del cartel", "received_data": dict(request.data)}, status=status.HTTP_400_BAD_REQUEST)
    
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
        return Response({"error": f"Error al procesar el poster: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

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
    logger = logging.getLogger('api')
    try:
        # Log para debugging (usar logger en producción, print en desarrollo)
        if settings.DEBUG:
            print(f"[COMMUNITY NOTIFY] Request recibido")
            print(f"[COMMUNITY NOTIFY] Content-Type: {request.content_type}")
            print(f"[COMMUNITY NOTIFY] Request data: {request.data}")
        else:
            logger.info("[COMMUNITY NOTIFY] Request recibido")
        
        pet_uuid = request.data.get('petId')
        scanner_location = request.data.get('scannerLocation')
        radius_km = int(request.data.get('radiusKm', 50))
        
        if settings.DEBUG:
            print(f"[COMMUNITY NOTIFY] pet_uuid: {pet_uuid}")
            print(f"[COMMUNITY NOTIFY] scanner_location: {scanner_location}")
            print(f"[COMMUNITY NOTIFY] radius_km: {radius_km}")
        
        if not pet_uuid or not scanner_location:
            error_msg = f"[COMMUNITY NOTIFY ERROR] Faltan datos - pet_uuid: {pet_uuid}, scanner_location: {scanner_location}"
            if settings.DEBUG:
                print(error_msg)
            else:
                logger.warning(error_msg)
            return Response({
                "error": "Se requiere ID de mascota y ubicación del escáner"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        pet = get_object_or_404(Pet, qr_uuid=pet_uuid)
        
        if not pet.is_lost:
            msg = f"[COMMUNITY NOTIFY] Mascota {pet.name} no está marcada como perdida"
            if settings.DEBUG:
                print(msg)
            else:
                logger.info(msg)
            return Response({
                "message": "La mascota no está marcada como perdida"
            })
        
        # Validar que scanner_location tenga latitude y longitude
        if not isinstance(scanner_location, dict) or 'latitude' not in scanner_location or 'longitude' not in scanner_location:
            error_msg = f"[COMMUNITY NOTIFY ERROR] scanner_location inválido: {scanner_location}"
            if settings.DEBUG:
                print(error_msg)
            else:
                logger.error(error_msg)
            return Response({
                "error": "scannerLocation debe contener latitude y longitude"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        recipients_count = send_community_scan_notification(
            pet, 
            scanner_location['latitude'], 
            scanner_location['longitude'],
            radius_km
        )
        
        msg = f"[COMMUNITY NOTIFY] Notificaciones enviadas a {recipients_count} usuarios"
        if settings.DEBUG:
            print(msg)
        else:
            logger.info(msg)
        
        return Response({
            "message": "Notificación comunitaria enviada",
            "recipients": recipients_count,
            "pet": {
                "name": pet.name,
                "breed": pet.breed,
                "is_lost": pet.is_lost,
                "last_seen": pet.last_seen_date
            }
        })
    except json.JSONDecodeError as e:
        error_msg = f"[COMMUNITY NOTIFY ERROR] JSON decode error: {str(e)}"
        if settings.DEBUG:
            print(error_msg)
        else:
            logger.error(error_msg)
        return Response(
            {'error': f'JSON inválido: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Pet.DoesNotExist:
        error_msg = f"[COMMUNITY NOTIFY ERROR] Mascota no encontrada con UUID: {pet_uuid}"
        if settings.DEBUG:
            print(error_msg)
        else:
            logger.warning(error_msg)
        return Response({"error": "Mascota no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        error_msg = f"[COMMUNITY NOTIFY ERROR] Error de formato: {str(e)}"
        if settings.DEBUG:
            print(error_msg)
        else:
            logger.error(error_msg)
        return Response({"error": f"Error de formato: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        error_msg = f"[COMMUNITY NOTIFY ERROR] Error general: {str(e)}"
        error_traceback = traceback.format_exc()
        if settings.DEBUG:
            print(error_msg)
            print(f"[COMMUNITY NOTIFY ERROR] Traceback: {error_traceback}")
        else:
            logger.error(error_msg)
            logger.error(f"Traceback: {error_traceback}")
        return Response({"error": f"Error inesperado: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LostPetView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        print("Solicitud POST recibida en LostPetView")  # Depuración
        print("Datos recibidos:", request.data)  # Mostrar datos enviados
        pet_id = request.data.get('pet_id')
        alert_data = request.data.get('alert_data')

        if not pet_id or not alert_data:
            return Response({
                "error": "Se requieren pet_id y alert_data",
                "received_data": dict(request.data)
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            pet = Pet.objects.get(id=pet_id, owner=request.user)
            alert = LostPetAlert.objects.create(
                pet=pet,
                owner_latitude=float(alert_data['latitude']),
                owner_longitude=float(alert_data['longitude']),
                radius_km=int(alert_data.get('radius_km', 3))
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

def send_lost_pet_email(pet, email, alert):
    subject = f"¡Ayúdanos a encontrar a {pet.name}! - Mascota perdida cerca de ti"
    
    # Enlace a Google Maps con la última ubicación
    maps_link = f"https://www.google.com/maps?q={alert.owner_latitude},{alert.owner_longitude}"
    
    # Construcción del mensaje HTML
    html_message = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #87a8d0, #f4b084); padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">¡Mascota Perdida!</h1>
            <p style="color: #ffffff; font-size: 16px; margin: 5px 0;">CollarMascotaQR necesita tu ayuda</p>
          </div>
          <!-- Contenido -->
          <div style="padding: 20px; background: #ffffff;">
            <h2 style="color: #4a3c31; font-size: 22px; margin-bottom: 15px;">¡{pet.name} se ha perdido!</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              Hola,<br>
              Una mascota llamada <strong>{pet.name}</strong> se ha perdido cerca de tu área. Te pedimos que estés atento/a y nos ayudes a reunirla con su dueño.
            </p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr style="background: #f5f1e9;">
                <td style="padding: 10px; font-weight: bold; color: #4a3c31;">Nombre:</td>
                <td style="padding: 10px; color: #333;">{pet.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #4a3c31;">Raza:</td>
                <td style="padding: 10px; color: #333;">{pet.breed or 'No especificada'}</td>
              </tr>
              <tr style="background: #f5f1e9;">
                <td style="padding: 10px; font-weight: bold; color: #4a3c31;">Última ubicación:</td>
                <td style="padding: 10px; color: #333;">
                  <a href="{maps_link}" style="color: #87a8d0; text-decoration: none;">Ver en Google Maps</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #4a3c31;">Contacto:</td>
                <td style="padding: 10px; color: #333;">{pet.phone or 'No disponible'}</td>
              </tr>
            </table>
            <!-- Foto de la mascota -->
            {f'<img src="{pet.photo}" alt="Foto de {pet.name}" style="max-width: 100%; height: auto; border-radius: 5px; margin: 10px 0;" />' if pet.photo else '<p style="color: #777;">No hay foto disponible</p>'}
            <!-- Botones -->
            <div style="text-align: center; margin: 20px 0;">
              <a href="{maps_link}" style="background: #87a8d0; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">Ver mapa</a>
              <a href="tel:{pet.phone}" style="background: #f4b084; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">Llamar al dueño</a>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.5;">
              Si ves a {pet.name}, por favor escanea su QR o contacta al dueño directamente. ¡Tu ayuda puede hacer la diferencia!
            </p>
          </div>
          <!-- Pie de página -->
          <div style="background: #f5f1e9; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p style="margin: 0;">© 2025 CollarMascotaQR - Juntos encontramos a {pet.name}</p>
            <p style="margin: 5px 0;">
              <a href="https://www.instagram.com/collarmascotaqr" style="color: #f4b084; text-decoration: none;">Síguenos en Instagram</a>
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    # Mensaje plano como respaldo
    plain_message = f"""
    ¡Mascota perdida cerca de ti!
    Nombre: {pet.name}
    Raza: {pet.breed or 'No especificada'}
    Última ubicación: {maps_link}
    Contacto: {pet.phone or 'No disponible'}
    Si la ves, escanea su QR o contacta al dueño.
    Gracias por tu ayuda,
    EncuentraME
    """

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as e:
        print(f"Error enviando correo a {email}: {str(e)}")

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
        "click_action": f"{settings.FRONTEND_URL}/lost-pet/{pet.id}",
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
                send_lost_pet_email(pet, user.email, alert)  # Usamos la versión mejorada
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
        "click_action": f"{settings.FRONTEND_URL}/found-pet/{pet.qr_uuid}",
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
    
@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_support_email(request):
    name = request.data.get('name')
    email = request.data.get('email')
    message = request.data.get('message')

    if not all([name, email, message]):
        return Response({"error": "Todos los campos son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

    subject = f"Solicitud de Soporte - CollarMascotaQR de {name}"
    plain_message = f"""
    Nombre: {name}
    Email: {email}
    Mensaje: 
    {message}
    """

    html_message = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #87a8d0, #f4b084); padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Solicitud de Soporte</h1>
            <p style="color: #ffffff; font-size: 16px; margin: 5px 0;">CollarMascotaQR</p>
          </div>
          <!-- Contenido -->
          <div style="padding: 20px; background: #ffffff;">
            <h2 style="color: #4a3c31; font-size: 22px; margin-bottom: 15px;">¡Hola, equipo de CollarMascotaQR!</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              Hemos recibido una nueva solicitud de soporte. Aquí están los detalles:
            </p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr style="background: #f5f1e9;">
                <td style="padding: 10px; font-weight: bold; color: #4a3c31; border: 1px solid #e0e0e0;">Nombre:</td>
                <td style="padding: 10px; color: #333; border: 1px solid #e0e0e0;">{name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #4a3c31; border: 1px solid #e0e0e0;">Email:</td>
                <td style="padding: 10px; color: #333; border: 1px solid #e0e0e0;">
                  <a href="mailto:{email}" style="color: #87a8d0; text-decoration: none;">{email}</a>
                </td>
              </tr>
              <tr style="background: #f5f1e9;">
                <td style="padding: 10px; font-weight: bold; color: #4a3c31; border: 1px solid #e0e0e0;">Mensaje:</td>
                <td style="padding: 10px; color: #333; border: 1px solid #e0e0e0;">{message}</td>
              </tr>
            </table>
            <p style="font-size: 14px; color: #666; line-height: 1.5;">
              Por favor, responde a este mensaje lo antes posible para asistir a {name}.
            </p>
          </div>
          <!-- Pie de página -->
          <div style="background: #f5f1e9; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p style="margin: 0;">© 2025 CollarMascotaQR - Todos los derechos reservados</p>
            <p style="margin: 5px 0;">
              <a href="https://www.instagram.com/collarmascotaqr" style="color: #f4b084; text-decoration: none;">Síguenos en Instagram</a>
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],
            html_message=html_message,
            fail_silently=False,
        )
        return Response({"message": "Correo enviado exitosamente"}, status=status.HTTP_200_OK)
    except Exception as e:
        error_details = str(e)
        print(f"Error al enviar correo: {error_details}")
        print(f"Traceback: {traceback.format_exc()}")
        return Response({
            "error": "Error al enviar el correo",
            "details": error_details if settings.DEBUG else "Error interno del servidor"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# views.py - Agregar vistas para gestionar QRs pre-generados

class PreGeneratedQRViewSet(viewsets.ModelViewSet):
    serializer_class = PreGeneratedQRSerializer
    # Solo el administrador debería poder gestionar estos QRs
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        return PreGeneratedQR.objects.all()
    
    @action(detail=False, methods=['post'])
    def generate_batch(self, request):
        """
        Genera un lote de QRs pre-generados
        """
        try:
            quantity = int(request.data.get('quantity', 1))
            if quantity < 1 or quantity > 100:
                return Response(
                    {"error": "La cantidad debe estar entre 1 y 100"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            created_qrs = []
            for _ in range(quantity):
                qr = PreGeneratedQR()
                qr.save()
                created_qrs.append(PreGeneratedQRSerializer(qr).data)
                
            return Response({
                "message": f"Se generaron {quantity} códigos QR",
                "qrs": created_qrs
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": f"Error al generar QRs: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
@api_view(['GET'])
@permission_classes([AllowAny])
def check_qr_status(request, uuid):
    """
    Verifica si un QR pre-generado está asignado o no
    """
    try:
        print(f"Verificando QR con UUID: {uuid}")
        
        # Primero busca en PreGeneratedQR
        qr = PreGeneratedQR.objects.filter(qr_uuid=uuid).first()
        if qr:
            print(f"QR encontrado en PreGeneratedQR: {qr.qr_uuid}, is_assigned: {qr.is_assigned}")
            
            # Si está marcado como asignado, verifica si hay un Pet asociado
            if qr.is_assigned:
                pet = Pet.objects.filter(qr_uuid=uuid).first()
                if not pet:
                    print(f"Advertencia: QR {uuid} está marcado como asignado pero no hay Pet asociado")
                    # Marcar como no asignado si no hay Pet
                    qr.is_assigned = False
                    qr.save()
                    print(f"QR {uuid} actualizado a is_assigned: False")

            response_data = {
                "is_assigned": qr.is_assigned,
                "uuid": str(qr.qr_uuid)
            }
            print(f"Respuesta: {response_data}")
            return Response(response_data)

        # Si no está en PreGeneratedQR, busca en Pet
        pet = Pet.objects.filter(qr_uuid=uuid).first()
        if pet:
            print(f"QR encontrado en Pet: {pet.qr_uuid}")
            response_data = {
                "is_assigned": True,  # Si está en Pet, está asignado
                "uuid": str(pet.qr_uuid)
            }
            print(f"Respuesta: {response_data}")
            return Response(response_data)

        # Si no se encuentra en ningún modelo
        print(f"QR no encontrado: {uuid}")
        return Response(
            {"error": "QR no encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )

    except Exception as e:
        print(f"Error al verificar QR {uuid}: {str(e)}")
        return Response(
            {"error": f"Error al verificar QR: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
@api_view(['POST'])
@permission_classes([AllowAny])
def register_pet_to_qr(request, uuid):
    try:
        # Verify QR exists and isn't assigned
        qr = get_object_or_404(PreGeneratedQR, qr_uuid=uuid, is_assigned=False)
        
        # Convert MultiValueDict to dict
        data = request.POST.dict()
        if 'photo' in request.FILES:
            data['photo'] = request.FILES['photo']

        # Add qr_uuid to data explicitly
        data['qr_uuid'] = str(uuid)  # Make sure it's a string

        serializer = PetSerializer(data=data)
        
        if serializer.is_valid():
            # Get authenticated user
            user = request.user if request.user.is_authenticated else None
            if not user:
                return Response({
                    "require_auth": True,
                    "message": "Authentication required to register a pet."
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Save the pet with the qr_uuid
            pet = serializer.save(owner=user, qr_uuid=uuid)
            
            # Transfer the QR code file from PreGeneratedQR to Pet
            if qr.qr_code:
                print("se guardo en pet")
                pet.qr_code = qr.qr_code
                pet.save()
            
            # Update QR status
            qr.is_assigned = True
            qr.save()

            return Response({
                "status": "success",
                "message": "Pet registered successfully",
                "pet": PetSerializer(pet).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {
                    "error": "Invalid data",
                    "details": serializer.errors
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        return Response(
            {
                "error": "Error processing request",
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_pending_registration(request):
    try:
        pending_data = request.session.get('pending_pet_data')
        pending_qr_uuid = request.session.get('pending_qr_uuid')
        
        if not pending_data or not pending_qr_uuid:
            return Response({
                "error": "No hay datos pendientes para registrar"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            qr = PreGeneratedQR.objects.get(qr_uuid=pending_qr_uuid, is_assigned=False)
        except PreGeneratedQR.DoesNotExist:
            if 'pending_pet_data' in request.session:
                del request.session['pending_pet_data']
            if 'pending_qr_uuid' in request.session:
                del request.session['pending_qr_uuid']
            return Response({
                "error": "El código QR ya no está disponible"
            }, status=status.HTTP_410_GONE)
        
        serializer = PetSerializer(data=pending_data)
        if serializer.is_valid():
            pet = serializer.save(owner=request.user)
            
            # Mover el QR al modelo Pet
            pet.qr_uuid = qr.qr_uuid
            pet.qr_code = qr.qr_code
            pet.save()
            
            # Eliminar el QR de PreGeneratedQR
            qr.delete()
            
            # Limpiar la sesión
            del request.session['pending_pet_data']
            del request.session['pending_qr_uuid']
            
            return Response({
                "message": "Registro completado exitosamente",
                "pet": PetSerializer(pet).data,
                "qr_uuid": str(pet.qr_uuid)
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            "error": f"Error al completar el registro: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
@api_view(['GET'])
@permission_classes([AllowAny])
def qr_redirect(request, uuid):
    """
    Determina a dónde redirigir según el estado del QR.
    - Si el QR está en PreGeneratedQR y is_assigned=False, redirige a /register-pet/{uuid}.
    - Si el QR está en Pet, redirige a /pet/{uuid}.
    - Si no se encuentra el QR, devuelve error.
    """
    try:
        print(f"UUID recibido: {uuid}")
        print(f"Datos de la petición: {request.GET}")
        # First, check if the QR exists in PreGeneratedQR
        qr = PreGeneratedQR.objects.filter(qr_uuid=uuid).first()
        if qr and not qr.is_assigned:
            return Response({
                "status": "unassigned",
                "redirect_to": f"/register-pet/{uuid}"
            })

        # If not in PreGeneratedQR, check the Pet model
        pet = Pet.objects.filter(qr_uuid=uuid).first()
        if pet:
            return Response({
                "status": "assigned",
                "redirect_to": f"/pet/{uuid}",
                "pet_data": PetSerializer(pet).data,
                "is_lost": pet.is_lost
            })

        # If QR is not found in either model
        return Response({
            "error": "QR no válido",
            "redirect_to": "/error"
        }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        print(f"Error en qr_redirect: {str(e)}")
        return Response({
            "error": f"Error al procesar el QR: {str(e)}",
            "redirect_to": "/error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Endpoint para solicitar recuperación de contraseña.
    Recibe email o username y envía un email con instrucciones.
    """
    try:
        email_or_username = request.data.get('email') or request.data.get('username')
        
        if not email_or_username:
            return Response({
                "error": "Por favor proporciona un email o nombre de usuario"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar usuario por email o username
        try:
            if '@' in email_or_username:
                # Usar filter().first() para evitar error si hay múltiples usuarios con el mismo email
                user = User.objects.filter(email=email_or_username).first()
            else:
                user = User.objects.filter(username=email_or_username).first()
            
            if not user:
                # Por seguridad, no revelamos si el usuario existe o no
                return Response({
                    "message": "Si el usuario existe, se enviará un email con instrucciones para recuperar la contraseña"
                }, status=status.HTTP_200_OK)
        except Exception as e:
            # Por seguridad, no revelamos si el usuario existe o no
            print(f"Error en request_password_reset: {e}")
            return Response({
                "message": "Si el usuario existe, se enviará un email con instrucciones para recuperar la contraseña"
            }, status=status.HTTP_200_OK)
        
        # Generar token de recuperación
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Construir URL de reset (el frontend manejará la página de reset)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
        
        # Enviar email
        subject = 'Recuperación de contraseña - Encuéntrame'
        message = f"""
        Hola {user.username},
        
        Has solicitado recuperar tu contraseña en EncuéntraME.
        
        Para restablecer tu contraseña, haz clic en el siguiente enlace:
        {reset_url}
        
        Si no solicitaste este cambio, puedes ignorar este email.
        
        Este enlace expirará en 24 horas.
        
        Saludos,
        El equipo de EncuéntraME
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Log del error para debugging
            error_msg = str(e)
            print(f"Error enviando email: {error_msg}")
            
            # En modo desarrollo, mostrar más información
            if settings.DEBUG:
                print(f"⚠️  DEBUG: Error al enviar email a {user.email}")
                print(f"⚠️  DEBUG: Verifica la configuración de EMAIL en settings.py")
                print(f"⚠️  DEBUG: Si estás en desarrollo, los emails se mostrarán en la consola")
            
            # Por seguridad, devolvemos el mismo mensaje genérico aunque falle el envío
            # Esto evita revelar información sobre el estado del sistema o si el usuario existe
            return Response({
                "message": "Si el usuario existe, se enviará un email con instrucciones para recuperar la contraseña"
            }, status=status.HTTP_200_OK)
        
        return Response({
            "message": "Si el usuario existe, se enviará un email con instrucciones para recuperar la contraseña"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error en request_password_reset: {str(e)}")
        return Response({
            "error": "Error al procesar la solicitud"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Endpoint para restablecer la contraseña usando el token.
    """
    try:
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not all([uid, token, new_password]):
            return Response({
                "error": "Faltan datos requeridos"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Decodificar uid
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                "error": "Token inválido o expirado"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar token
        if not default_token_generator.check_token(user, token):
            return Response({
                "error": "Token inválido o expirado"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar nueva contraseña
        if len(new_password) < 8:
            return Response({
                "error": "La contraseña debe tener al menos 8 caracteres"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cambiar contraseña
        user.set_password(new_password)
        user.save()
        
        return Response({
            "message": "Contraseña restablecida exitosamente"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error en reset_password: {str(e)}")
        return Response({
            "error": "Error al restablecer la contraseña"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)