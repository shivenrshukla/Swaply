// src/services/api.js
import axios from 'axios';

const api = axios.create({
  // No baseURL is needed anymore!
  // Axios will make requests to relative paths (e.g., '/api/stats'),
  // and Vite will proxy them correctly.
  headers: {
    'Content-Type': 'application/json',
  },
});

// The rest of the file (interceptor) remains exactly the same.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;