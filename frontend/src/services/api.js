import axios from 'axios';

// Production (Render): frontend and backend share one URL, so use relative /api.
// Local dev: Vite runs on its own port, so call the backend on port 5000.
// VITE_API_BASE_URL still overrides both if you set it.
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
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