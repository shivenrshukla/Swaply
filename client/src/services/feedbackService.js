import api from './api';

// Submit new feedback
const submitFeedback = (data) => api.post('/api/feedback', data);

// Get all feedback (admin or public depending on backend)
const getAllFeedback = () => api.get('/api/feedback');

export default {
  submitFeedback,
  getAllFeedback,
};
