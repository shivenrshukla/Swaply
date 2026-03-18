import api from './api';

const swapService = {
  // --- Request Management ---

  sendSwapRequest: async (requestData) => {
    try {
      const response = await api.post('/api/requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Error sending swap request:', error.response?.data || error.message);
      throw error;
    }
  },

  getReceivedRequests: async () => {
    try {
      const response = await api.get('/api/requests/received');
      return response.data;
    } catch (error) {
      console.error('Error fetching received requests:', error.response?.data || error.message);
      throw error;
    }
  },

  acceptRequest: async (requestId) => {
    try {
      const response = await api.put(`/api/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting request:', error.response?.data || error.message);
      throw error;
    }
  },

  rejectRequest: async (requestId) => {
    try {
      const response = await api.put(`/api/requests/${requestId}/reject`);
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
      const response = await api.post('/api/matches/create', matchData);
      return response.data;
    } catch (error) {
      console.error('Error creating match:', error.response?.data || error.message);
      throw error;
    }
  },

  getMatches: async (status = 'all') => {
    try {
      const response = await api.get('/api/matches', { params: { status } });
      return response.data;
    } catch (error) {
      console.error('Error fetching matches:', error.response?.data || error.message);
      throw error;
    }
  },

  markMatchComplete: async (matchId) => {
    try {
      const response = await api.put(`/api/matches/${matchId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error marking match as complete:', error.response?.data || error.message);
      throw error;
    }
  },

  cancelMatch: async (matchId) => {
    try {
      const response = await api.put(`/api/matches/${matchId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling match:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default swapService;