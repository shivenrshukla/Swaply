// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import userService from '../services/userService';
import swapService from '../services/swapService';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import SwapRequestModal from '../components/SwapRequestModal';

const Home = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Function to fetch all users, excluding the current authenticated user
  const fetchUsers = async () => {
    try {
      const res = await userService.getAllUsers();
      // Filter out the current user from the list of all users
      const filtered = res.data.users?.filter(u => u._id !== user?._id) || [];
      setUsers(filtered);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRequestSwap = (targetUser) => {
    setSelectedUser(targetUser);
    setModalOpen(true);
  };

  const handleSendSwap = async (requestData) => {
    try {
      await swapService.sendSwapRequest(requestData);
      console.log(`Swap request sent successfully to ${selectedUser.name}!`);
      setModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Swap request error:', err);
      throw err;
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 text-gray-100 relative overflow-x-hidden">
      <header className="py-28 text-center relative z-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-6xl sm:text-7xl font-semibold tracking-tight bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent select-none animate-subtleTilt">
          SkillSwap
        </h1>
        <div className="mx-auto mt-4 mb-8 w-20 h-1 bg-blue-400 rounded-full shadow-lg"></div>
        <p className="max-w-xl mx-auto text-lg sm:text-xl font-light tracking-wide text-blue-300 animate-gradientShift">
          Learn, Connect, and Grow — Exchange your skills with confidence.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-28 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <p className="text-blue-300 text-lg">Loading amazing people...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-blue-400 text-lg">No users found.</p>
            <p className="text-gray-400 text-sm mt-2">Be the first to join the community!</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-cyan-300 mb-4">
                Connect with Skilled People
              </h2>
              <p className="text-blue-200 max-w-2xl mx-auto">
                Browse through our community of learners and experts. Find someone whose skills complement yours and start your skill exchange journey.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {users.map((u) => (
                <UserCard
                  key={u._id}
                  user={u}
                  onRequestSwap={handleRequestSwap}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <SwapRequestModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        targetUser={selectedUser}
        onSubmit={handleSendSwap}
      />

      <div aria-hidden="true" className="fixed top-24 right-12 w-48 h-48 bg-blue-600 opacity-30 rounded-full blur-3xl animate-floatSlow shadow-blue-500/70"></div>
      <div aria-hidden="true" className="fixed bottom-28 left-10 w-72 h-72 bg-blue-gray-700 opacity-20 rounded-full blur-3xl animate-floatSlow delay-3000 shadow-blue-600/60"></div>
      <div aria-hidden="true" className="fixed top-40 left-1/2 w-40 h-40 bg-cyan-600 opacity-20 rounded-full blur-3xl animate-floatSlow delay-1500 shadow-cyan-400/60" style={{ transform: 'translateX(-50%)' }}></div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        @keyframes subtleTilt {
          0%, 100% { transform: rotateX(0deg) rotateY(0deg); }
          50% { transform: rotateX(2deg) rotateY(2deg); }
        }

        .animate-gradientShift {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          display: inline-block;
        }

        .animate-floatSlow {
          animation: floatSlow 12s ease-in-out infinite;
        }

        .animate-subtleTilt {
          animation: subtleTilt 12s ease-in-out infinite;
          display: inline-block;
          transform-style: preserve-3d;
          perspective: 800px;
          cursor: default;
        }

        .delay-3000 {
          animation-delay: 3s;
        }

        .delay-1500 {
          animation-delay: 1.5s;
        }
      `}</style>
    </div>
  )
}

export default Home;
