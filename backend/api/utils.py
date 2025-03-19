import json
from webpush import send_web_push
from django.conf import settings
from .models import DeviceRegistration, UserLocation
import firebase_admin
from firebase_admin import messaging

def send_lost_pet_notifications(pet, alert):
    """Envía notificaciones push a los usuarios cercanos a la mascota perdida."""
    latitude = alert.owner_latitude
    longitude = alert.owner_longitude
    radius_km = alert.radius_km

    # Obtener los dispositivos de usuarios cercanos (esto debería basarse en tu lógica de geolocalización)
    users_within_radius = UserLocation.objects.filter(
        latitude__gte=latitude - radius_km,
        latitude__lte=latitude + radius_km,
        longitude__gte=longitude - radius_km,
        longitude__lte=longitude + radius_km
    )

    # Contar los dispositivos notificados
    recipients_count = 0
    for user_location in users_within_radius:
        devices = DeviceRegistration.objects.filter(user=user_location.user)
        for device in devices:
            # Enviar la notificación Push
            payload = {
                "head": "¡Tu mascota está perdida!",
                "body": f"{pet.name} ha sido reportada como perdida.",
                "icon": pet.qr_code.url if pet.qr_code else "",
                "url": f"/pet/{pet.id}/lost"
            }
            try:
                send_fcm_notification(device.registration_id, payload)
                recipients_count += 1
            except Exception as e:
                print(f"Error enviando notificación: {str(e)}")
    
    return recipients_count

def send_fcm_notification(registration_id, payload):
    """Envía notificación a través de Firebase Cloud Messaging."""
    message = messaging.Message(
        notification=messaging.Notification(
            title=payload["head"],
            body=payload["body"],
            image=payload["icon"]
        ),
        token=registration_id,
        data=payload,
    )
    
    try:
        # Enviar la notificación
        response = messaging.send(message)
        print(f"Notificación enviada a {registration_id} con respuesta: {response}")
    except Exception as e:
        print(f"Error enviando notificación FCM: {str(e)}")
