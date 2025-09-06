// components/AnnouncementsPage.jsx
import { useState, useEffect } from 'react';
import { announcementService } from '../services/announcementService';

const GetAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await announcementService.markAsRead(messageId);
      
      // Update local state
      setAnnouncements(prev => prev.map(announcement => 
        announcement._id === messageId 
          ? { ...announcement, isRead: true, readAt: new Date() }
          : announcement
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading announcements...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">📢</span>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Announcements
        </h1>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📭</span>
          <h2 className="text-xl font-semibold text-gray-400 mb-2">No announcements</h2>
          <p className="text-gray-500">Check back later for updates from the team.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              className={`bg-gray-800 rounded-lg p-6 border-l-4 ${
                announcement.priority === 'high' 
                  ? 'border-red-500' 
                  : announcement.priority === 'medium'
                  ? 'border-yellow-500'
                  : 'border-blue-500'
              } ${!announcement.isRead ? 'ring-2 ring-blue-500/30' : 'opacity-75'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-white">{announcement.title}</h3>
                <div className="flex items-center gap-2">
                  {announcement.priority === 'high' && <span className="text-red-400">🔴</span>}
                  {announcement.priority === 'medium' && <span className="text-yellow-400">🟡</span>}
                  {announcement.priority === 'low' && <span className="text-blue-400">🔵</span>}
                  {!announcement.isRead && (
                    <button
                      onClick={() => markAsRead(announcement._id)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-gray-300 mb-4 leading-relaxed">{announcement.content}</p>
              
              <div className="text-sm text-gray-500 flex justify-between items-center">
                <span>
                  From: {announcement.sender?.name || 'System'}
                </span>
                <span>
                  {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GetAnnouncements;
