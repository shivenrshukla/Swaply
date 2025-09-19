import axios from 'axios';

const api = axios.create({
  baseURL: '/api/chat',
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // or however you store your auth token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get all chat conversations for the logged-in user
const getMyChats = () => api.get('/my');

// Get all messages between logged-in user and another user
const getMessagesWith = (userId) => api.get(`/with/${userId}`);

// Send a new message
const sendMessage = (messageData) => api.post('/send', messageData);

export default {
  getMyChats,
  getMessagesWith,
  sendMessage,
};