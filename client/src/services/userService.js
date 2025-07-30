// src/services/userService.js
import axios from 'axios';

const API_URL = 'http://localhost:8001/api/users';

const getAllUsers = async () => {
  const token = localStorage.getItem('token') // Or use your auth context
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  return axios.get(API_URL, config)
};

export default {
  getAllUsers
};