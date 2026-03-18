import api from './api';

export const announcementService = {
  // Get all announcements for current user
  async getAnnouncements() {
    const response = await api.get('/api/messages/announcements');
    return response.data.announcements || [];
  },

  // Mark announcement as read
  async markAsRead(messageId) {
    const response = await api.patch(`/api/messages/${messageId}/read`);
    return response.data;
  },

  // Get unread count
  async getUnreadCount() {
    const response = await api.get('/api/messages/announcements/unread-count');
    return response.data;
  }
};
