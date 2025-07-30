import { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import { useAuth } from '../context/AuthContext';

const ManageUsers = ({ onPageChange }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers(page);
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSetAdmin = async (userId, isAdmin) => {
    if (userId === currentUser?._id) {
      alert("You cannot change your own admin status.");
      return;
    }
    try {
      await adminService.setAdminStatus(userId, isAdmin);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update admin status:", error);
      alert("Could not update admin status.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?._id) {
      alert("You cannot delete yourself.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this user permanently? This action cannot be undone.')) {
      try {
        await adminService.deleteUser(userId);
        fetchUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert("Could not delete user.");
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="text-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => onPageChange('admin')} className="text-blue-400 hover:text-blue-300 mb-4">
          &larr; Back to Admin Dashboard
        </button>
        <h1 className="text-3xl font-bold text-cyan-300 mb-6">Manage Users</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400">Error: {error}</p>
            <button 
              onClick={fetchUsers} 
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-yellow-400">No users found.</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 shadow-lg rounded-lg overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-750 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.isAdmin ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-900 text-cyan-300 border border-cyan-500">
                            ⚡ Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400 border border-gray-600">
                            👤 User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.isBanned ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300 border border-red-500">
                            🚫 Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300 border border-green-500">
                            ✅ Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          {user.isAdmin ? (
                            <button 
                              onClick={() => handleSetAdmin(user._id, false)} 
                              disabled={user._id === currentUser?._id}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 
                                         bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500
                                         text-white border-yellow-500 hover:border-yellow-400 
                                         shadow-md hover:shadow-lg hover:shadow-yellow-500/25
                                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                                         transform hover:scale-105 active:scale-95"
                            >
                              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                              Remove Admin
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleSetAdmin(user._id, true)} 
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200
                                         bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500
                                         text-white border-emerald-500 hover:border-emerald-400
                                         shadow-md hover:shadow-lg hover:shadow-emerald-500/25
                                         transform hover:scale-105 active:scale-95"
                            >
                              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                              </svg>
                              Make Admin
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleDeleteUser(user._id)} 
                            disabled={user._id === currentUser?._id}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200
                                       bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500
                                       text-white border-red-500 hover:border-red-400
                                       shadow-md hover:shadow-lg hover:shadow-red-500/25
                                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                                       transform hover:scale-105 active:scale-95"
                          >
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-4">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                             bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500
                             text-white border-gray-600 hover:border-gray-500
                             shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                             transform hover:scale-105 active:scale-95"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-lg border border-gray-600">
                    Page {page} of {totalPages}
                  </span>
                </div>
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                             bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500
                             text-white border-gray-600 hover:border-gray-500
                             shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                             transform hover:scale-105 active:scale-95"
                >
                  Next
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;