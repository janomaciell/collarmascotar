// services/notification.js

// Register device for push notifications
export const registerForPushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Este navegador no soporta notificaciones push');
  }
  
  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/credentials/firebase-adminsdk.json');
    console.log('Service Worker registrado');
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
    });
    
    // Send the subscription to the server
    const response = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    
    if (!response.ok) {
      throw new Error('Error registrando notificaciones');
    }
    
    return subscription;
  } catch (err) {
    console.error('Error en registro de notificaciones:', err);
    throw err;
  }
};

// Subscribe to pet alerts in a specific area
export const subscribeToPetAlerts = async (location, radiusKm = 50) => {
  try {
    const response = await fetch('/api/pets/lost/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location,
        radiusKm
      })
    });
    
    if (!response.ok) {
      throw new Error('Error suscribiéndose a alertas');
    }
    
    return await response.json();
  } catch (err) {
    console.error('Error en suscripción a alertas:', err);
    throw err;
  }
};

// Helper function to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}