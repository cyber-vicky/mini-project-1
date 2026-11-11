import axios from 'axios';

// Production split hosting: set VITE_API_BASE_URL to your backend URL (e.g. https://<backend>.onrender.com/api).
// Single-origin production: falls back to relative /api.
// Local dev: Vite runs on its own port, so call the backend on port 5000.
const normalizeApiBaseUrl = (rawUrl) => {
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const envBaseUrl = import.meta.env.VITE_API_BASE_URL
  ? normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
  : '';

const baseURL =
  envBaseUrl ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const apiOrigin = baseURL.replace(/\/api\/?$/, '');

export const resolveMediaUrl = (mediaPath) => {
  if (!mediaPath) return '';
  if (/^https?:\/\//i.test(mediaPath)) return mediaPath;
  const normalizedPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
  return `${apiOrigin}${normalizedPath}`;
};

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;