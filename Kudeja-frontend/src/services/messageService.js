import api from './api';

export const sendMessage = (data) => api.post('/messages', data);
export const getMessages = () => api.get('/messages');
export const getUserMessages = () => api.get('/messages/my');
export const getUnreadCount = () => api.get('/messages/unread-count');
export const getAdminUnreadCount = () => api.get('/messages/admin-unread-count');
export const markMessageAsRead = (id) => api.patch(`/messages/${id}/read`);
export const markAllAsReadByUser = () => api.patch('/messages/mark-user-read');
export const replyMessage = (id, data) => api.post(`/messages/${id}/reply`, data);
export const deleteMessage = (id) => api.delete(`/messages/${id}`);
export const sendAIChat = (data) => api.post('/messages/chat', data);
