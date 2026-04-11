import api from './api';

export const createOrder = (payload) => api.post('/orders', payload);
// Orders for the currently logged-in user
export const getOrders = () => api.get('/orders');
// All orders (for admin views)
export const getAllOrders = () => api.get('/orders?all=true');

export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const confirmOrderReceipt = (id, data) => api.patch(`/orders/${id}/confirm`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
