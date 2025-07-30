// src/pages/AdminPanel.jsx
import { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import { FaUsers, FaSyncAlt, FaExclamationCircle, FaStar } from 'react-icons/fa';

// This is a simple card component for displaying stats.
const StatCard = ({ icon, title, value, color }) => (
  <div className={`bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 ${color}`}>
    <div className="flex items-center">
      <div className="mr-4 text-3xl">{icon}</div>
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const AdminPanel = ({ onPageChange }) => { // <-- Accept onPageChange prop
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getStats();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="text-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-300 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<FaUsers />} title="Total Users" value={stats?.users?.total ?? 'N/A'} color="border-blue-500" />
          <StatCard icon={<FaSyncAlt />} title="Total Swaps" value={stats?.requests?.total ?? 'N/A'} color="border-green-500" />
          <StatCard icon={<FaExclamationCircle />} title="Pending Skills" value={stats?.pendingSkills ?? 'N/A'} color="border-yellow-500" />
          <StatCard icon={<FaStar />} title="Average Rating" value={stats?.ratings?.average.toFixed(2) ?? 'N/A'} color="border-purple-500" />
        </div>

        {/* These buttons can navigate if you add cases for them in App.jsx */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
           <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Admin Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button onClick={() => onPageChange('manage-users')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg">
                Manage Users
              </button>
              <button onClick={() => onPageChange('announcements')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg">
                Announcements
              </button>
              <button onClick={() => alert('Export data page coming soon!')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg">
                Export Data
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;