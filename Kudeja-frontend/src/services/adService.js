import axios from 'axios';

const API_URL = 'http://localhost:5000/api/ads';

export const getAds = async () => {
  return await axios.get(API_URL);
};

export const getAllAds = async () => {
  const token = localStorage.getItem('token');
  return await axios.get(`${API_URL}/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createAd = async (adData) => {
  const token = localStorage.getItem('token');
  return await axios.post(API_URL, adData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateAd = async (id, adData) => {
  const token = localStorage.getItem('token');
  return await axios.put(`${API_URL}/${id}`, adData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteAd = async (id) => {
  const token = localStorage.getItem('token');
  return await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
