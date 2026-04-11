import api from './api';

export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const addProductReview = (id, data) => api.post(`/products/${id}/reviews`, data);

/**
 * Upload a product image to Cloudinary via the backend proxy.
 * @param {File} file  - The image File object from an <input type="file">
 * @returns {Promise<{url: string}>}
 */
export const uploadProductImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/products/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};