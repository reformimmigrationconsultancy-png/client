import axios from 'axios';

const isProduction = import.meta.env.PROD;
const api = axios.create({
  baseURL: isProduction ? '/lead/api' : 'http://localhost:8000/api',
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
