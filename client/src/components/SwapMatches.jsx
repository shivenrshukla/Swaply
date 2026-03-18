// Enhanced SwapMatches.jsx with better debugging and error handling
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import swapService from '../services/swapService';
import { useNavigation } from '../context/NavigationContext';

// inside component

const SwapMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const { navigate } = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);

  // const handleOpenChat = (matchId) => {
  //   navigate('chat', { matchId });
  // };

  // Normalize userId (handles both id and _id)
  const userId = user?._id || user?.id;

  const fetchMatches = async () => {
    try {
      if (!userId) {
        console.log('❌ No user available for fetching matches');
        setError('Please log in to view matches');
        return;
      }

      setLoading(true);
      setError('');

      console.log('🔍 Fetching matches for user:', userId, 'with filter:', filter);

      const response = await swapService.getMatches(filter);

      console.log('📥 Raw API response:', response);

      const matchesArray = response.matches || [];

      console.log('📊 Processed matches:', matchesArray);
      console.log('📈 Number of matches found:', matchesArray.length);

      // Set debug info for display
      setDebugInfo({
        userId,
        filter,
        rawResponse: response,
        matchesCount: matchesArray.length,
        timestamp: new Date().toISOString()
      });

      setMatches(matchesArray);
    } catch (err) {
      console.error('❌ Error fetching matches:', err);
      console.error('❌ Error response data:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);

      setError(
        err.response?.data?.message ||
        'Failed to load matches. Please try again.'
      );

      setDebugInfo({
        error: err.message,
        status: err.response?.status,
        data: err.response?.data,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      console.log('👤 User available, fetching matches...', userId);
      fetchMatches();
    } else {
      console.log('❌ No user available for fetching matches');
      setLoading(false);
    }
  }, [filter, userId]);

  const handleMarkComplete = async (matchId) => {
    setActionLoading(prev => ({ ...prev, [matchId]: true }));
    try {
      await swapService.markMatchComplete(matchId);
      setMatches(prev => prev.map(match =>
        match._id === matchId
          ? { ...match, status: 'completed', progress: 100, completedAt: new Date() }
          : match
      ));
      console.log('✅ Match marked complete:', matchId);
    } catch (err) {
      console.error('❌ Error marking match complete:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [matchId]: false }));
    }
  };

  const handleCancelMatch = async (matchId) => {
    setActionLoading(prev => ({ ...prev, [matchId]: true }));
    try {
      await swapService.cancelMatch(matchId);
      setMatches(prev => prev.map(match =>
        match._id === matchId
          ? { ...match, status: 'cancelled' }
          : match
      ));
      console.log('✅ Match cancelled:', matchId);
    } catch (err) {
      console.error('❌ Error cancelling match:', err);
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

  const handleChatClick = (matchId) => {
  console.log('Opening chat for match:', matchId);
  navigate('chat', { matchId });
};

  const getOtherParticipant = (match) => {
    if (!userId) return null;
    return match.participants?.find(p => p.user?._id !== userId);
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  // Show debug panel in development
  const showDebug = process.env.NODE_ENV === 'development';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-blue-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-lg mb-6">{error}</p>
          <button
            onClick={fetchMatches}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>

          {showDebug && debugInfo && (
            <div className="mt-8 p-4 bg-gray-800 rounded-lg text-left">
              <h3 className="text-yellow-400 font-bold mb-2">Debug Info:</h3>
              <pre className="text-xs text-gray-300 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 text-gray-100 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-300">🤝 Your Skill Swaps</h1>
          <p className="text-blue-200 max-w-2xl mx-auto">
            Track your ongoing and completed skill exchanges.
          </p>
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
            <p className="text-blue-400 text-lg mb-4">
              No matches found for filter: {filter}
            </p>
            <p className="text-gray-400 text-sm">
              Total matches in database: {matches.length}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredMatches.map((match) => {
              const otherParticipant = getOtherParticipant(match);

              if (!otherParticipant) {
                console.warn('⚠️ No other participant found for match:', match._id);
                return (
                  <div key={match._id} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400">⚠️ Invalid match data - missing participant</p>
                    <pre className="text-xs text-gray-400 mt-2">
                      {JSON.stringify(match, null, 2)}
                    </pre>
                  </div>
                );
              }

              const currentUserParticipant = match.participants?.find(
                p => p.user?._id === userId
              );
              const skillOffered = currentUserParticipant?.skillOffered?.skillName;
              const skillRequested = currentUserParticipant?.skillRequested?.skillName;

              return (
                <div key={match._id} className="bg-gradient-to-br from-gray-800 to-blue-gray-900 border border-blue-700 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={otherParticipant.user.avatar || `https://placehold.co/48x48/1e293b/e2e8f0?text=${otherParticipant.user.name?.charAt(0) || '?'}`}
                        alt={otherParticipant.user.name || 'Unknown'}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-300">
                          {otherParticipant.user.name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Matched on: {formatDate(match.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(match.status)}`}>
                      {match.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-600/20 p-4 rounded-lg border border-green-500/30">
                      <p className="text-xs text-green-200 mb-1">YOU TEACH</p>
                      <p className="text-green-300 font-medium text-lg">
                        {skillOffered || 'Not specified'}
                      </p>
                    </div>
                    <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30">
                      <p className="text-xs text-blue-200 mb-1">YOU LEARN</p>
                      <p className="text-blue-300 font-medium text-lg">
                        {skillRequested || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {match.status === 'active' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleMarkComplete(match._id)}
                        disabled={actionLoading[match._id]}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
                      >
                        {actionLoading[match._id] ? 'Loading...' : 'Mark Complete'}
                      </button>
                      <button
                        onClick={() => handleCancelMatch(match._id)}
                        disabled={actionLoading[match._id]}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
                      >
                        {actionLoading[match._id] ? 'Loading...' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => navigate('direct-messages', { 
                          _id: otherParticipant.user._id, 
                          name: otherParticipant.user.name 
                        })}
                        disabled={actionLoading[match._id]}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold px-4 py-2 rounded-lg"
                      >
                        {actionLoading[match._id] ? 'Loading...' : '💬 Chat'}
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
