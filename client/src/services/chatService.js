import axios from 'axios';

const API = import.meta.env.VITE_API_URL + '/api/chat';

// Get all chat conversations for the logged-in user
const getMyChats = () => axios.get(`${API}/my`);

// Get all messages between logged-in user and another user
const getMessagesWith = (userId) => axios.get(`${API}/with/${userId}`);

// Send a new message
const sendMessage = (messageData) => axios.post(`${API}/send`, messageData);

export default {
  getMyChats,
  getMessagesWith,
  sendMessage,
};