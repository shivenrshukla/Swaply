import api from './api';

const adminService = {
  /**
   * Fetches platform-wide statistics for the admin dashboard.
   */
  getStats: () => {
    return api.get('/api/admin/stats');
  },

  /**
   * Fetches a paginated list of all users.
   */
  getUsers: (page = 1, limit = 10) => {
    return api.get(`/api/admin/users?page=${page}&limit=${limit}`);
  },

  /**
   * Updates a user's admin status.
   */
  setAdminStatus: (userId, isAdmin) => {
    return api.patch(`/api/admin/users/${userId}/set-admin`, { isAdmin });
  },

  /**
   * Deletes a user from the database.
   */
  deleteUser: (userId) => {
    return api.delete(`/api/admin/users/${userId}`);
  },
};

export default adminService;