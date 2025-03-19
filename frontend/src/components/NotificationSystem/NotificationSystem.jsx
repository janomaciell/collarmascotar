import React, { useState, useEffect } from 'react';
import { registerForPushNotifications, subscribeToPetAlerts } from '../../services/notification';
import './NotificationSystem.css';

const NotificationSystem = () => {
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [radius, setRadius] = useState(50); // Default radius 50km
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if notifications are already permitted
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Check if user is already subscribed
      const checkSubscriptionStatus = async () => {
        try {
          const status = await fetch('/api/notifications/status');
          const data = await status.json();
          setIsSubscribed(data.isSubscribed);
          setRadius(data.radius || 50);
        } catch (err) {
          console.error('Error checking subscription status:', err);
        }
      };
      
      checkSubscriptionStatus();
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          const token = await registerForPushNotifications();
          console.log('Notification permission granted, token:', token);
        }
      }
    } catch (err) {
      setError('Error al solicitar permisos de notificación: ' + err.message);
      console.error(err);
    }
  };

  const handleSubscribe = async () => {
    try {
      if (notificationPermission !== 'granted') {
        await handleRequestPermission();
      }
      
      // Get current location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          // Subscribe to alerts within radius
          await subscribeToPetAlerts(location, radius);
          setIsSubscribed(true);
        },
        (err) => {
          setError('No se pudo obtener tu ubicación: ' + err.message);
          console.error('Geolocation error:', err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (err) {
      setError('Error al suscribirse a alertas: ' + err.message);
      console.error(err);
    }
  };

  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value);
    setRadius(newRadius);
    
    // If already subscribed, update subscription with new radius
    if (isSubscribed) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          await subscribeToPetAlerts(location, newRadius);
        },
        (err) => console.error('Error updating location:', err)
      );
    }
  };

  return (
    <div className="notification-system">
      <h3>Sistema de Alertas Comunitarias</h3>
      <p>
        Recibe notificaciones cuando se reporte una mascota perdida cerca de ti
        para ayudar a reunir mascotas con sus dueños.
      </p>
      
      {notificationPermission !== 'granted' && (
        <button 
          onClick={handleRequestPermission}
          className="permission-button"
        >
          Permitir Notificaciones
        </button>
      )}
      
      <div className="radius-selector">
        <label htmlFor="radius">Radio de alertas: {radius} km</label>
        <input
          type="range"
          id="radius"
          name="radius"
          min="5"
          max="100"
          step="5"
          value={radius}
          onChange={handleRadiusChange}
        />
      </div>
      
      <button 
        onClick={handleSubscribe} 
        className={`subscribe-button ${isSubscribed ? 'subscribed' : ''}`}
        disabled={isSubscribed}
      >
        {isSubscribed ? 'Ya estás suscrito' : 'Suscribirse a Alertas'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="info-box">
        <p><strong>¿Cómo funciona?</strong></p>
        <ul>
          <li>Recibirás notificaciones cuando alguien reporte una mascota perdida en tu área</li>
          <li>Si encuentras una mascota, puedes escanear su QR para notificar al dueño</li>
          <li>La comunidad se ayuda mutuamente para recuperar mascotas perdidas</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationSystem;