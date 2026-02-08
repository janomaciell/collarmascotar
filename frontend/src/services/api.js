import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

// Configuración global de Axios
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Detectar si estamos en desarrollo
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Interceptor para requests (asegurar JSON válido)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    
    // Con FormData no enviar Content-Type para que axios use multipart/form-data con boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.data && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Log solo en desarrollo
    if (isDevelopment) {
      console.log('[Axios Request]', {
        url: config.url,
        method: config.method,
        data: config.data,
        headers: config.headers,
        withCredentials: config.withCredentials,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[Axios Request Error]', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses (debugging mejorado)
axios.interceptors.response.use(
  (response) => {
    // Log solo en desarrollo
    if (isDevelopment) {
      console.log('[Axios Response Success]', {
        url: response.config.url,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    // Logging mejorado de errores
    const errorInfo = {
      url: error.config?.url,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    };
    
    // Detectar errores CORS específicamente
    if (error.message === 'Network Error' && !error.response) {
      errorInfo.possibleCorsError = true;
      console.error('[Axios Response Error - Posible CORS]', errorInfo);
    } else {
      console.error('[Axios Response Error]', errorInfo);
    }
    
    return Promise.reject(error);
  }
);


export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {})
  };
};

export const login = async (credentials) => {
  try {
    const url = `${API_URL}/login/`;
    console.log('Login URL:', url); // Debug the URL
    const response = await axios.post(url, credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const register = async (userData) => {
  try {
    const url = `${API_URL}/register/`;
    console.log('Register URL:', url); // Debug the URL
    const response = await axios.post(url, userData);
    return response.data;
  } catch (error) {
    console.error('Register error:', error.response?.data || error.message);
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
    console.log(`Attempting to fetch pet with UUID: ${uuid}`);
    const response = await axios.get(`${API_URL}/pets/uuid/${uuid}/`);
    if (response.data.status === 'success' && response.data.data) {
      console.log("Pet data retrieved successfully:", response.data.data);
      return response.data.data;
    } else {
      throw new Error('Mascota no encontrada');
    }
  } catch (error) {
    console.error('Error fetching pet data:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener datos de la mascota');
  }
};

const getFullImageUrl = (relativePath) => {
  if (!relativePath) return 'https://via.placeholder.com/300x300/9333ea/ffffff?text=Sin+Foto';
  
  // Si ya es una URL completa, devolverla tal como está
  if (relativePath.startsWith('http')) return relativePath;
  
  // Si es una ruta relativa, construir la URL completa
  return `${API_URL}${relativePath}`;
};

export const getPetById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/pets/${id}/`);
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
    const url = `${API_URL}/pets/${uuid}/scan/`;
    const payload = {
      latitude: parseFloat(location.latitude),
      longitude: parseFloat(location.longitude),
    };
    
    // Log detallado solo en desarrollo
    if (isDevelopment) {
      console.log('[API] Enviando POST a:', url);
      console.log('[API] Payload:', payload);
    }
    
    const response = await axios.post(
      url,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // IMPORTANTE: No enviar credenciales para evitar problemas CORS
        withCredentials: false,
      }
    );
    
    if (isDevelopment) {
      console.log('[API] Respuesta exitosa:', response.status, response.data);
    }
    return response.data;
  } catch (error) {
    // Logging mejorado de errores
    console.error('[API] Error en notifyOwner:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      // Agregar información del error de red
      isNetworkError: !error.response,
      isCorsError: error.message === 'Network Error' && !error.response,
    });
    
    // Proporcionar mensaje de error más útil
    if (!error.response) {
      throw new Error('Error de conexión. Verifica tu conexión a internet o los permisos de ubicación.');
    }
    
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
    const url = `${API_URL}/notifications/community/`;
    const payload = {
      petId,
      scannerLocation: {
        latitude: parseFloat(scannerLocation.latitude),
        longitude: parseFloat(scannerLocation.longitude),
      },
      radiusKm,
    };
    
    // Log solo en desarrollo
    if (isDevelopment) {
      console.log('[API] Enviando notificación comunitaria a:', url);
      console.log('[API] Payload:', payload);
    }
    
    const response = await axios.post(
      url,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: false,
      }
    );
    
    if (isDevelopment) {
      console.log('[API] Respuesta de notificación comunitaria:', response.status, response.data);
    }
    return response.data;
  } catch (error) {
    console.error('[API] Error en sendCommunityNotification:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      isNetworkError: !error.response,
      isCorsError: error.message === 'Network Error' && !error.response,
    });
    
    if (!error.response) {
      throw new Error('Error de conexión al enviar notificación comunitaria.');
    }
    
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
  const response = await fetch(`${API_URL}/pets/${petId}/poster/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',  // Ajustado para JSON
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
    // Asegurarse que la URL esté bien formada
    const url = `${API_URL}/check-qr/${uuid}/`;
    console.log('Intentando conectar a:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error del servidor:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
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
    console.log('Token enviado:', token); // Depuración
    if (!token) {
      throw new Error('No se encontró un token de autenticación');
    }
    const response = await fetch(`${API_URL}/register-pet-to-qr/${uuid}/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
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
    console.error('Error completo:', error);
    throw error;
  }
};

export const completePendingRegistration = async (petData, qrUuid) => {
  try {
    const response = await axios.post(`${API_URL}/complete-registration/`, {
      ...petData,
      qr_uuid: qrUuid
    });
    return response.data;
  } catch (error) {
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

export const requestPasswordReset = async (emailOrUsername) => {
  try {
    const response = await axios.post(`${API_URL}/password-reset/request/`, {
      email: emailOrUsername.includes('@') ? emailOrUsername : undefined,
      username: emailOrUsername.includes('@') ? undefined : emailOrUsername
    });
    return response.data;
  } catch (error) {
    console.error('Error en requestPasswordReset:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const resetPassword = async (uid, token, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/password-reset/reset/`, {
      uid,
      token,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Error en resetPassword:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const updatePet = async (petId, petData) => {
  try {
    const config = petData instanceof FormData
      ? { transformRequest: [(data, headers) => { delete headers['Content-Type']; return data; }] }
      : {};
    const response = await axios.put(`${API_URL}/pets/${petId}/`, petData, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
