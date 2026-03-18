// src/services/userService.js
import api from './api';

const getAllUsers = async () => {
    // Interceptor in api.js handles Authorization header
    return api.get('/api/users')
};

export default {
    getAllUsers
};