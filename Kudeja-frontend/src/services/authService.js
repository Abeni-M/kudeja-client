import api from './api';

export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const getCurrentUser = () => api.get('/auth/me');
export const updateProfile = (userData) => api.put('/auth/profile', userData);