import api from './api';

export const initializePayment = (paymentData) => api.post('/payments/initialize', paymentData);

export const verifyPayment = (txRef) => api.get(`/payments/verify/${txRef}`);
