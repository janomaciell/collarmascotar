import React from 'react';
import NotificationSubscription from './NotificationSubscription';

const NotificationSettings = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración de Notificaciones</h2>
      <div className="space-y-6">
        <NotificationSubscription />
      </div>
    </div>
  );
};

export default NotificationSettings;
