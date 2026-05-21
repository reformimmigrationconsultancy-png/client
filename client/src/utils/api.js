import axios from 'axios';

const isDev = import.meta.env.DEV;
const hasLeadPrefix = window.location.pathname.startsWith('/lead');

const getBaseURL = () => {
  if (isDev) {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return `${window.location.origin}${hasLeadPrefix ? '/lead' : ''}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
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
