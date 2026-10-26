import api from './api';
import { uploadFile } from './uploadService';

export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const addProductReview = (id, data) => api.post(`/products/${id}/reviews`, data);

/**
 * Upload a product image to server storage.
 * @param {File} file  - The image File object from an <input type="file">
 * @returns {Promise<{url: string}>}
 */
export const uploadProductImage = async (file) => {
  const result = await uploadFile(file, 'image');
  return { data: result };
};
