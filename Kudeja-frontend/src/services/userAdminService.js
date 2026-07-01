import api from './api';

export const getUsers = ({ page = 1, limit = 20 } = {}) =>
  api.get(`/admin/users?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`);

export const getUser = (id) => api.get(`/admin/users/${encodeURIComponent(id)}`);

export const updateUserRole = (id, role) =>
  api.patch(`/admin/users/${encodeURIComponent(id)}/role`, { role });

export const updateUserStatus = (id, isActive) =>
  api.patch(`/admin/users/${encodeURIComponent(id)}/status`, { isActive });

