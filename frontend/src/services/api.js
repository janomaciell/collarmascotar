import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3001/api';

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login/`, credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getPets = async () => {
  try {
    const response = await axios.get(`${API_URL}/pets/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createPet = async (petData) => {
  try {
    const response = await axios.post(`${API_URL}/pets/`, petData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getPetByUuid = async (uuid) => {
  try {
    const response = await axios.get(`${API_URL}/pet/${uuid}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getScanHistory = async (petId) => {
  try {
    const response = await axios.get(`${API_URL}/pets/${petId}/scans/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const notifyOwner = async (uuid, location) => {
  try {
    const response = await axios.post(`${API_URL}/pets/${uuid}/scan/`, {
      latitude: location.latitude,
      longitude: location.longitude,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updatePetLostStatus = async (petId, isLost) => {
  try {
    const response = await axios.patch(`${API_URL}/pets/${petId}/`, { is_lost: isLost });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

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

export const createReward = async (petId, rewardData) => {
  try {
    const response = await axios.post(`${API_URL}/rewards/create/${petId}/`, rewardData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getUserPoints = async () => {
  console.log('Fetching points from:', `${API_URL}/user/points/`);
  try {
    const response = await axios.get(`${API_URL}/user/points/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Nuevas funciones para las rutas faltantes
export const updateUserLocation = async (locationData) => {
  try {
    const response = await axios.post(`${API_URL}/location/update/`, locationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const generateLostPoster = async (petId, posterData) => {
  try {
    const response = await axios.post(`${API_URL}/pets/${petId}/poster/`, posterData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getReward = async (petId) => {
  try {
    const response = await axios.get(`${API_URL}/rewards/create/${petId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
const response = await fetch(`${API_URL}/users/points-history/`, {
  headers: { 'Authorization': `Token ${localStorage.getItem('token')}` },
});