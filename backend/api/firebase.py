import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings

# Inicializar Firebase Admin SDK
cred = credentials.Certificate(str(settings.FIREBASE_CREDENTIALS_PATH))
firebase_admin.initialize_app(cred)

def send_push_notification(token, title, body, data=None):
    """
    Envía una notificación push usando Firebase Cloud Messaging
    
    Args:
        token (str): Token del dispositivo destino
        title (str): Título de la notificación
        body (str): Contenido de la notificación
        data (dict): Datos adicionales para la notificación
    """
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        
        response = messaging.send(message)
        return response
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
        raise

def send_multicast_notification(tokens, title, body, data=None):
    """
    Envía una notificación a múltiples dispositivos
    
    Args:
        tokens (list): Lista de tokens de dispositivos
        title (str): Título de la notificación
        body (str): Contenido de la notificación
        data (dict): Datos adicionales para la notificación
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
        return response
    except Exception as e:
        print(f"Error sending multicast notification: {str(e)}")
        raise