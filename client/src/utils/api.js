import axios from 'axios';

const isDev = import.meta.env.DEV;

const pathname = window.location.pathname;
const hasLeadPrefix = pathname === '/lead' || pathname.startsWith('/lead/');

export const BACKEND_URL = isDev
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : `${window.location.origin}${hasLeadPrefix ? '/lead' : ''}`;

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
