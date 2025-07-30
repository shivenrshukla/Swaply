// src/components/SwapMatches.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import swapService from '../services/swapService';

const SwapMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [actionLoading, setActionLoading] = useState({});

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await swapService.getMatches(filter);
      setMatches(response.matches || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchMatches();
    }
  }, [filter, user]);

  const handleMarkComplete = async (matchId) => {
    // TODO: Implement a custom confirmation modal for a better user experience.
    setActionLoading(prev => ({ ...prev, [matchId]: true }));
    try {
      await swapService.markMatchComplete(matchId);
      // Update local state for immediate feedback
      setMatches(prev => prev.map(match =>
        match._id === matchId
          ? { ...match, status: 'completed', progress: 100, completedAt: new Date() }
          : match
      ));
      // TODO: Show a success toast/notification.
    } catch (err) {
      console.error('Error marking match complete:', err);
      // TODO: Show an error toast/notification.
    } finally {
      setActionLoading(prev => ({ ...prev, [matchId]: false }));
    }
  };

  const handleCancelMatch = async (matchId) => {
    // TODO: Implement a custom confirmation modal.
    setActionLoading(prev => ({ ...prev, [matchId]: true }));
    try {
      await swapService.cancelMatch(matchId);
      // Update local state for immediate feedback
      setMatches(prev => prev.map(match =>
        match._id === matchId
          ? { ...match, status: 'cancelled' }
          : match
      ));
      // TODO: Show a success toast/notification.
    } catch (err) {
      console.error('Error cancelling match:', err);
      // TODO: Show an error toast/notification.
    } finally {
      setActionLoading(prev => ({ ...prev, [matchId]: false }));
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-600/30 text-green-200 border-green-500/30';
      case 'completed': return 'bg-blue-600/30 text-blue-200 border-blue-500/30';
      case 'cancelled': return 'bg-red-600/30 text-red-200 border-red-500/30';
      default: return 'bg-gray-600/30 text-gray-200 border-gray-500/30';
    }
  };

  const getOtherParticipant = (match) => {
    if (!user?._id) return null;
    return match.participants.find(p => p.user._id !== user._id);
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-blue-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">
            <div className="text-center">
                <p className="text-lg mb-4">{error}</p>
                <button onClick={fetchMatches} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                    Retry
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 text-gray-100 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-300">🤝 Your Skill Swaps</h1>
          <p className="text-blue-200 max-w-2xl mx-auto">Track your ongoing and completed skill exchanges.</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 rounded-lg p-1 border border-blue-500/30">
            {['all', 'active', 'completed', 'cancelled'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  filter === filterOption
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-200 hover:text-white hover:bg-blue-600/50'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-blue-400 text-lg">No matches found for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredMatches.map((match) => {
              const otherParticipant = getOtherParticipant(match);
              if (!otherParticipant) return null;
              
              const skillOffered = match.participants.find(p => p.user._id === user._id)?.skillOffered.skillName;
              const skillRequested = match.participants.find(p => p.user._id === user._id)?.skillRequested.skillName;

              return (
                <div key={match._id} className="bg-gradient-to-br from-gray-800 to-blue-gray-900 border border-blue-700 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={otherParticipant.user.avatar || `https://placehold.co/48x48/1e293b/e2e8f0?text=${otherParticipant.user.name.charAt(0)}`}
                        alt={otherParticipant.user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-300">{otherParticipant.user.name}</h3>
                        <p className="text-sm text-gray-400">Matched on: {formatDate(match.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(match.status)}`}>
                      {match.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-600/20 p-4 rounded-lg border border-green-500/30">
                      <p className="text-xs text-green-200 mb-1">YOU TEACH</p>
                      <p className="text-green-300 font-medium text-lg">{skillOffered}</p>
                    </div>
                    <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30">
                      <p className="text-xs text-blue-200 mb-1">YOU LEARN</p>
                      <p className="text-blue-300 font-medium text-lg">{skillRequested}</p>
                    </div>
                  </div>

                  {match.status === 'active' && (
                    <div className="flex gap-3">
                      <button onClick={() => handleMarkComplete(match._id)} disabled={actionLoading[match._id]} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg">
                        {actionLoading[match._id] ? '...' : 'Mark Complete'}
                      </button>
                      <button onClick={() => handleCancelMatch(match._id)} disabled={actionLoading[match._id]} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg">
                        {actionLoading[match._id] ? '...' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapMatches;