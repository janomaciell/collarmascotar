import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../services/api';

const NotificationSubscription = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/notification/status/`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
      setIsSubscribed(response.data.isSubscribed);
    } catch (err) {
      setError('Error al verificar el estado de suscripción');
      console.error('Error checking subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromNotifications = async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setError(null);
    } catch (err) {
      setError('Error al cancelar la suscripción');
      console.error('Error unsubscribing from notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Notificaciones Push</h3>
          <p className="text-sm text-gray-500">
            {isSubscribed
              ? 'Estás suscrito a las notificaciones push'
              : 'No estás suscrito a las notificaciones push'}
          </p>
        </div>
        {isSubscribed && (
          <button
            onClick={unsubscribeFromNotifications}
            className="px-4 py-2 rounded-md text-white font-medium bg-red-500 hover:bg-red-600"
            disabled={loading}
          >
            Cancelar Suscripción
          </button>
        )}
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">¿Qué notificaciones recibirás?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Alertas cuando una mascota perdida esté cerca de tu ubicación</li>
          <li>Actualizaciones sobre mascotas que has ayudado a encontrar</li>
          <li>Notificaciones sobre recompensas disponibles en tu área</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationSubscription;