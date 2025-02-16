import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Configurar interceptor para añadir token a las peticiones
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login/`, credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    throw error;
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
    throw error;
  }
};

export const createPet = async (petData) => {
  try {
    const response = await axios.post(`${API_URL}/pets/`, petData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPetByUuid = async (uuid) => {
  try {
    const response = await axios.get(`${API_URL}/pet/${uuid}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 