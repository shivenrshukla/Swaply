import api from './api';

// Login user with email & password
const login = (credentials) => api.post('/api/auth/login', credentials);

// Register new user with name, email & password
const register = (userData) => api.post('/api/auth/register', userData);

export default {
  login,
  register,
};