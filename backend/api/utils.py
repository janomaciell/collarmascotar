import json
from webpush import send_web_push
from django.conf import settings
from .models import DeviceRegistration, UserLocation
import firebase_admin
from firebase_admin import messaging


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
