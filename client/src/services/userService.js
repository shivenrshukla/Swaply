// src/services/userService.js
import axios from 'axios';

const getAllUsers = async () => {
  const token = localStorage.getItem('token') // Or use your auth context
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  return axios.get('/api/users', config)
};

export default {
  getAllUsers
};