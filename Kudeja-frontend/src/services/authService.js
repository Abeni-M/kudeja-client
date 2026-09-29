import api from './api';

export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const googleLogin = (credential) => api.post('/auth/google', { credential });
export const getCurrentUser = () => api.get('/auth/me');
export const updateProfile = (userData) => api.put('/auth/profile', userData);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, newPassword) => api.post('/auth/reset-password', { token, newPassword });