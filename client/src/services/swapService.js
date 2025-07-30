// src/services/swapService.js
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api/', // CORRECTED: Use a relative path to work with the Vite proxy
  timeout: 10000,
});

// Add auth token to requests from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Ensure this matches how you store the token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors, such as 401 for an invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token is expired or invalid, clear it and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const swapService = {
  /**
   * Sends a new skill swap request to the backend.
   * @param {object} requestData - The data for the swap request.
   * @param {string} requestData.recipientId - The ID of the user receiving the request.
   * @param {string} requestData.skillToOffer - The skill being offered.
   * @param {string} requestData.skillToRequest - The skill being requested.
   * @param {string} requestData.message - Additional message.
   * @param {string} requestData.proposedDuration - Proposed duration.
   * @param {string} requestData.proposedSchedule - Proposed schedule.
   */
  sendSwapRequest: async (requestData) => {
    try {
      // Transform the data to match backend expectations
      const transformedData = {
        recipientId: requestData.recipientId,
        skillToOffer: requestData.skillToOffer,
        skillToRequest: requestData.skillToRequest,
        message: requestData.message,
        proposedDuration: requestData.proposedDuration,
        proposedSchedule: requestData.proposedSchedule
      };

      console.log('Sending request data:', transformedData); // Debug log
      
      const response = await api.post('/requests', transformedData);
      return response.data;
    } catch (error) {
      console.error('Error sending swap request:', error.response?.data || error.message);
      
      // Log detailed error information for debugging
      if (error.response?.data?.errors) {
        console.log('Validation errors:', error.response.data.errors);
        error.response.data.errors.forEach((err, index) => {
          console.log(`Error ${index + 1}:`, err);
        });
      }
      
      throw error;
    }
  },

  /**
   * Fetches received swap requests for the authenticated user.
   * Aligned with the GET /api/requests/received route.
   */
  getReceivedRequests: async () => {
    try {
      const response = await api.get('/requests/received');
      return response.data;
    } catch (error) {
      console.error('Error fetching received requests:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Accepts a swap request.
   * Aligned with the PUT /api/requests/:id/accept route.
   * @param {string} requestId - The ID of the request to accept.
   */
  acceptRequest: async (requestId) => {
    try {
      const response = await api.put(`/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting request:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Rejects a swap request.
   * Aligned with the PUT /api/requests/:id/reject route.
   * @param {string} requestId - The ID of the request to reject.
   */
  rejectRequest: async (requestId) => {
    try {
      const response = await api.put(`/requests/${requestId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting request:', error.response?.data || error.message);
      throw error;
    }
  },

  // --- Existing Match Functions ---
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