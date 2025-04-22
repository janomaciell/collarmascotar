import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, '');

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

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {})
  };
};

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, userData);
    console.log('Register URL:', `${API_URL}/register/`); // Debug
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login/`, credentials);
    console.log('Login URL:', `${API_URL}/login/`); // Debug
    localStorage.setItem('token', response.data.token);
    console.log('Token guardado:', response.data.token); // Debug
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
    console.log(`Fetching pet with UUID: ${uuid}`);
    const response = await fetch(`${API_URL}/pets/${uuid}/`);
    console.log(`Response status: ${response.status}`);
    if (response.status === 401) {
      throw new Error('Se requiere autenticación para ver esta mascota');
    }
    if (!response.ok) {
      throw new Error('QR no válido o no encontrado');
    }
    const data = await response.json();
    console.log('Pet data retrieved:', data);
    return data;
  } catch (error) {
    console.error('Error fetching pet data:', error);
    throw error;
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

export const updateUserLocation = async (locationData) => {
  try {
    const response = await axios.post(`${API_URL}/location/update/`, locationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const generateLostPoster = async (petId, posterData) => {
  const response = await fetch(`${API_URL}/pets/${petId}/poster/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(posterData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }

  return response.json();
};

export const getReward = async (petId) => {
  try {
    const response = await axios.get(`${API_URL}/rewards/create/${petId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const checkQRStatus = async (uuid) => {
  try {
    const url = `${API_URL}/check-qr/${uuid}/`;
    console.log('Conectando a:', url); // Debug
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error del servidor:', { status: response.status, errorText });
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error en checkQRStatus:', error);
    throw error;
  }
};

export const registerPetToQR = async (uuid, petData) => {
  try {
    const token = localStorage.getItem('token');
    console.log('Token enviado en registerPetToQR:', token); // Depuración
    if (!token) {
      throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
    }
    const response = await fetch(`${API_URL}/register-pet-to-qr/${uuid}/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        // No establecer Content-Type para FormData
      },
      body: petData,
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Error de la API:', data);
      throw new Error(JSON.stringify(data, null, 2) || 'Error al registrar mascota');
    }
    return data;
  } catch (error) {
    console.error('Error completo en registerPetToQR:', error);
    throw error;
  }
};

export const completePendingRegistration = async (petData, qrUuid) => {
  try {
    const token = localStorage.getItem('token');
    console.log('Token enviado en completePendingRegistration:', token); // Depuración
    if (!token) {
      throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
    }
    const response = await axios.post(`${API_URL}/complete-registration/`, petData, {
      headers: {
        Authorization: `Token ${token}`,
        // No establecer Content-Type para FormData
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error en completePendingRegistration:', error);
    throw new Error(error.response?.data?.error || 'Error al completar el registro');
  }
};

export const generateBatchQRs = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/pre-generated-qrs/generate_batch/`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getQRRedirectInfo = async (uuid) => {
  try {
    const response = await axios.get(`${API_URL}/qr/${uuid}/`);
    return response.data;
  } catch (error) {
    console.error('Error en getQRRedirectInfo:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Error al verificar el QR');
  }
};