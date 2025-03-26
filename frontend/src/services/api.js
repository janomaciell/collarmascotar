import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, ''); // Elimina la barra al final, si existe

// Configurar interceptor para añadir token a las peticiones
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Registro de usuario
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Inicio de sesión
export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login/`, credentials);
    localStorage.setItem('token', response.data.token);  // Almacenar el token
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Cierre de sesión
export const logout = () => {
  localStorage.removeItem('token');
};

// Obtener lista de mascotas
export const getPets = async () => {
  try {
    const response = await axios.get(`${API_URL}/pets/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Crear una mascota
export const createPet = async (petData) => {
  try {
    const response = await axios.post(`${API_URL}/pets/`, petData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtener mascota por UUID (público)
export const getPetByUuid = async (uuid) => {
  try {
    const response = await axios.get(`${API_URL}/pet/${uuid}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Obtener historial de escaneos
export const getScanHistory = async (petId) => {
  try {
    const response = await axios.get(`${API_URL}/pets/${petId}/scans/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Notificar al dueño (escaneo del QR)
export const notifyOwner = async (uuid, location) => {
  try {
    const response = await axios.post(`${API_URL}/pet/${uuid}/scan/`, {
      latitude: location.latitude,
      longitude: location.longitude,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Actualizar estado de "perdido"
export const updatePetLostStatus = async (petId, isLost) => {
  try {
    const response = await axios.patch(`${API_URL}/pets/${petId}/`, { is_lost: isLost });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Notificar a la comunidad (mascota perdida)
export const sendCommunityNotification = async (petId, scannerLocation, radiusKm) => {
  try {
    const response = await axios.post(`${API_URL}/notifications/community/`, {
      petId,
      scannerLocation,
      radiusKm,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};