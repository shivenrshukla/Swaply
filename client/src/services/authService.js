import axios from 'axios';

// Use the correct environment variable name here:
const API = import.meta.env.VITE_API_BASE_URL + '/api/auth';

// Login user with email & password
const login = (credentials) => axios.post(`${API}/login`, credentials);

// Register new user with name, email & password
const register = (userData) => axios.post(`${API}/register`, userData);

export default {
  login,
  register,
};