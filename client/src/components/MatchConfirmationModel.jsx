// src/components/MatchConfirmationModal.jsx
import { useState } from 'react';
import swapService from '../services/swapService'; // Assuming you have a service for API calls

const MatchConfirmationModal = ({ request, onMatchCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    duration: '1 Month', // Default value
    schedule: '',
    startDate: new Date().toISOString().split('T')[0], // Default to today
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.schedule) {
      setError('Please suggest a schedule.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        requestId: request._id,
        duration: formData.duration,
        schedule: formData.schedule,
        startDate: formData.startDate,
      };
      
      const newMatch = await swapService.createMatch(payload); // Assumes an apiService function
      onMatchCreated(newMatch); // Pass the new match data up to the parent component

    } catch (err) {
      setError(err.message || 'Failed to create match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-cyan-300 mb-4">Finalize Your Skill Swap</h2>
        <p className="text-gray-300 mb-6">
          You've accepted the request! Just set the terms below to get started.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="duration" className="block text-sm font-medium text-gray-400 mb-2">Duration</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option>1 Month</option>
              <option>3 Months</option>
              <option>6 Months</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="schedule" className="block text-sm font-medium text-gray-400 mb-2">Suggested Schedule</label>
            <input
              type="text"
              id="schedule"
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              placeholder="e.g., Tuesdays at 6 PM IST"
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-md font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Confirm & Start Swap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchConfirmationModal;