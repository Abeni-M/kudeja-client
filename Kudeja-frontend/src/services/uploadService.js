import api from './api';

const rawUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

/**
 * Resolves any image URL so relative paths (/uploads/..., /images/...) point to the backend host in production.
 * @param {string} url 
 * @returns {string}
 */
export function resolveMediaUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Relative path starting with /uploads/ or /images/
  if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return rawUrl ? `${rawUrl}${cleanPath}` : cleanPath;
  }

  return trimmed;
}

/**
 * Upload an image file (product, ad, or payment screenshot)
 * @param {File|Blob} file
 * @param {string} fieldName - 'image' | 'receipt' | 'file'
 * @returns {Promise<{url: string, relativeUrl: string, filename: string}>}
 */
export async function uploadFile(file, fieldName = 'image') {
  const formData = new FormData();
  formData.append(fieldName, file);

  try {
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    // Fallback to /products/upload for legacy endpoint compatibility
    const fallbackRes = await api.post('/products/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return fallbackRes.data;
  }
}

/**
 * Upload base64 image data to convert to a public image URL on the server
 * @param {string} dataUrl 
 * @param {string} preferredName 
 * @returns {Promise<{url: string, relativeUrl: string, filename: string}>}
 */
export async function uploadBase64Image(dataUrl, preferredName = 'upload') {
  const res = await api.post('/upload/base64', {
    dataUrl,
    filename: preferredName,
  });
  return res.data;
}
