import axios from 'axios';

const isDev = import.meta.env.DEV;

export const BACKEND_URL = isDev
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : 'https://lead-tgdl.onrender.com';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
