// src/services/userService.js
import api from './api';

const getAllUsers = async () => {
    return api.get('/api/users');
};

const getUserById = async (id) => {
    return api.get(`/api/users/${id}`);
};

const getUserProfile = async () => {
    return api.get('/api/users/profile');
};

const searchUsers = async (query) => {
    return api.get(`/api/users/search?q=${query}`);
};

export default {
    getAllUsers,
    getUserById,
    getUserProfile,
    searchUsers
};