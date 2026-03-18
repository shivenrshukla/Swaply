export const announcementService = {
  // Get all announcements for current user
  async getAnnouncements() {
    const response = await fetch('/api/messages/announcements', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch announcements');
    }

    const data = await response.json();

    return data.announcements || [];
  },

  // Mark announcement as read
  async markAsRead(messageId) {
    const response = await fetch(`/api/messages/${messageId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark as read');
    }

    return response.json();
  },

  // Get unread count
  async getUnreadCount() {
    const response = await fetch('/api/messages/announcements/unread-count', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get unread count');
    }

    return response.json();
  }
};
