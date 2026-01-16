import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../services/api';
import { FaBell } from 'react-icons/fa';

const NotificationPromptModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('hasSeenNotificationPrompt');
    if (!hasSeenPrompt) {
      const timer = setTimeout(() => {
        setShowModal(true);
        localStorage.setItem('hasSeenNotificationPrompt', 'true');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const subscribeToNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Las notificaciones push no son compatibles con este navegador');
      return;
    }

    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });

      await axios.post(
        `${API_URL}/register_device/`,
        {
          registration_id: JSON.stringify(subscription),
          device_type: 'web',
        },
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      setIsSubscribed(true);
      setShowModal(false);
    } catch (err) {
      setError('Error al activar las notificaciones');
      console.error('Error subscribing to notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          <FaBell /> ¡No te pierdas ninguna mascota perdida!
        </h2>
        <p className="text-gray-600 mb-6">
          Activa las notificaciones para recibir alertas instantáneas sobre mascotas cerca de ti.
        </p>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <div className="flex justify-between">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            disabled={loading}
          >
            Ahora no
          </button>
          <button
            onClick={subscribeToNotifications}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Activando...' : 'Activar ahora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPromptModal;