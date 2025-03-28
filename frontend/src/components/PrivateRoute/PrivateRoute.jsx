import React from 'react';
import { Navigate } from 'react-router-dom';

const isAuthenticated = () => {
  return localStorage.getItem('token') !== null; // Usa 'token' como en api.js
};

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

export default PrivateRoute;