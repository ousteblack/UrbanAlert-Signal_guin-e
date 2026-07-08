import api from './api';

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  // Autres nettoyages si nécessaire
};

export const forgotPassword = async (identifier) => {
  const response = await api.post('/auth/forgot-password', { identifier });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

export const activateAccount = async (data) => {
  const response = await api.post('/auth/activate', data);
  return response.data;
};
