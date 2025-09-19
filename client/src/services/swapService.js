import axios from 'axios';

// Create an axios instance with base configuration.
// This is a best practice for managing API calls.
const api = axios.create({
  baseURL: '/api/',
  timeout: 10000,
});

// Use an interceptor to automatically add the auth token to every request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Use an interceptor to handle global response errors, like 401 Unauthorized.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token is expired or invalid, log the user out.
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

const swapService = {
  // --- Request Management ---

  sendSwapRequest: async (requestData) => {
    try {
      const response = await api.post('/requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Error sending swap request:', error.response?.data || error.message);
      throw error;
    }
  },

  getReceivedRequests: async () => {
    try {
      const response = await api.get('/requests/received');
      return response.data;
    } catch (error) {
      console.error('Error fetching received requests:', error.response?.data || error.message);
      throw error;
    }
  },

  acceptRequest: async (requestId) => {
    try {
      const response = await api.put(`/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting request:', error.response?.data || error.message);
      throw error;
    }
  },

  rejectRequest: async (requestId) => {
    try {
      const response = await api.put(`/requests/${requestId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting request:', error.response?.data || error.message);
      throw error;
    }
  },
 
  // --- Match Management ---

  /**
   * Creates a new match from an accepted request.
   * @param {object} matchData - The payload containing { requestId, duration, schedule, startDate }.
   * @returns {object} The newly created match object.
   */
  createMatch: async (matchData) => {
    try {
      // CORRECTED: Uses the 'api' instance, so auth headers are added automatically.
      const response = await api.post('/matches/create', matchData);
      return response.data;
    } catch (error) {
      console.error('Error creating match:', error.response?.data || error.message);
      throw error;
    }
  },

  getMatches: async (status = 'all') => {
    try {
      const response = await api.get('/matches', { params: { status } });
      return response.data;
    } catch (error) {
      console.error('Error fetching matches:', error.response?.data || error.message);
      throw error;
    }
  },

  markMatchComplete: async (matchId) => {
    try {
      const response = await api.put(`/matches/${matchId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error marking match as complete:', error.response?.data || error.message);
      throw error;
    }
  },

  cancelMatch: async (matchId) => {
    try {
      const response = await api.put(`/matches/${matchId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling match:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default swapService;