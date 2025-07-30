import axios from 'axios';

const API = import.meta.env.VITE_API_URL + '/api/feedback';

// Submit new feedback
const submitFeedback = (data) => axios.post(API, data);

// Get all feedback (admin or public depending on backend)
const getAllFeedback = () => axios.get(API);

export default {
  submitFeedback,
  getAllFeedback,
};
