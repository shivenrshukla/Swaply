// src/components/IncomingRequests.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import swapService from '../services/swapService';

const IncomingRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      // Use the corrected service function
      const data = await swapService.getReceivedRequests();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load incoming requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRequestResponse = async (requestId, status) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      if (status === 'accepted') {
        await swapService.acceptRequest(requestId);
      } else {
        await swapService.rejectRequest(requestId);
      }
      // Refetch requests to get the updated list
      fetchRequests();
    } catch (err) {
      console.error('Error responding to request:', err);
      // Optionally show an error message to the user
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div></div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 text-gray-100 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-300">📨 Incoming Requests</h1>
          <p className="text-blue-200">Review and respond to skill swap requests.</p>
        </div>

        {requests.filter(r => r.status === 'pending').length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-blue-400 text-lg">No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.filter(r => r.status === 'pending').map((request) => (
              <div key={request._id} className="bg-gradient-to-br from-gray-800 to-blue-gray-900 border border-blue-700 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex items-center gap-4 md:w-1/3">
                    <img src={request.requester.profilePhoto || `https://placehold.co/64x64/1e293b/e2e8f0?text=${request.requester.name.charAt(0)}`} alt={request.requester.name} className="w-16 h-16 rounded-full object-cover border-4 border-blue-500"/>
                    <div>
                      <h3 className="text-xl font-semibold text-cyan-300">{request.requester.name}</h3>
                      <p className="text-xs text-gray-400">{formatDate(request.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-600/20 p-3 rounded-lg border border-green-500/30">
                        <p className="text-xs text-green-200 mb-1">THEY OFFER</p>
                        {/* Correctly access the nested skillName property */}
                        <p className="text-green-300 font-medium">{request.skillOffered.skillName}</p>
                      </div>
                      <div className="bg-blue-600/20 p-3 rounded-lg border border-blue-500/30">
                        <p className="text-xs text-blue-200 mb-1">THEY WANT</p>
                        {/* Correctly access the nested skillName property */}
                        <p className="text-blue-300 font-medium">{request.skillRequested.skillName}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-300 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                        <span className="font-medium text-gray-400">Message:</span> {request.message}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleRequestResponse(request._id, 'accepted')} disabled={actionLoading[request._id]} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg">
                        {actionLoading[request._id] ? '...' : 'Accept'}
                      </button>
                      <button onClick={() => handleRequestResponse(request._id, 'rejected')} disabled={actionLoading[request._id]} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg">
                        {actionLoading[request._id] ? '...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomingRequests;