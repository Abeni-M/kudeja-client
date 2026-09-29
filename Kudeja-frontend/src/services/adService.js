import api from './api';

export const getAds = async () => {
  return await api.get('/ads');
};

export const getAllAds = async () => {
  return await api.get('/ads/all');
};

export const createAd = async (adData) => {
  return await api.post('/ads', adData);
};

export const updateAd = async (id, adData) => {
  return await api.put(`/ads/${id}`, adData);
};

export const deleteAd = async (id) => {
  return await api.delete(`/ads/${id}`);
};
