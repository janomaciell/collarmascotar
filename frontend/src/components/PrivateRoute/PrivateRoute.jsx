import React from 'react';
import { Navigate } from 'react-router-dom';

// Simulación de una función de autenticación
const isAuthenticated = () => {
  // Aquí deberías verificar el estado de autenticación real, por ejemplo, comprobando un token en el almacenamiento local
  return localStorage.getItem('authToken') !== null;
};

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

export default PrivateRoute; 