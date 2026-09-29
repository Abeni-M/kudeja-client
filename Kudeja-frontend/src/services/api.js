import axios from 'axios';

const rawUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_URL = rawUrl ? `${rawUrl}/api/v1` : '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;