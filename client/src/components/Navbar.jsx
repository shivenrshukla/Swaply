// src/components/Navbar.jsx
import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = useMemo(() => {
    const items = [
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'requests', label: 'Requests', icon: '📨' },
      { id: 'matches', label: 'Matches', icon: '🤝' },
      { id: 'profile', label: 'Profile', icon: '👤' },
    ];

    if (user?.isAdmin) {
      items.push({ id: 'admin', label: 'Admin', icon: '⚙️' });
    }
    return items;
  }, [user]);

  const handleNavClick = (pageId) => {
    onPageChange(pageId);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    onPageChange('login');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-blue-500/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
          >
            SkillSwap
          </button>

          <span className="font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent transition-all duration-300 hover:brightness-110 cursor-default">
            👋 Hello, {user?.name || 'User'}
          </span>
          {/* --- Desktop View --- */}
          <div className="hidden md:flex items-center">
            {user ? (
              <>
                {/* Navigation Links */}
                <div className="flex items-baseline space-x-4">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                        currentPage === item.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-blue-600/50 hover:text-white'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* User Info and Logout Button */}
                <div className="ml-4 flex items-center space-x-3">
                    
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2"
                    >
                        <span>🚪</span>
                        Logout
                    </button>
                </div>
              </>
            ) : (
              // Fallback for logged-out users on desktop
              <button onClick={() => onPageChange('login')} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Sign In</button>
            )}
          </div>
          
          {/* --- Mobile Menu Button --- */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white"
            >
              {isMenuOpen ? (
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- Mobile Menu --- */}
      {/* CORRECTED: Removed '&& user' to allow menu to open for everyone */}
      {isMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {user ? (
            <>
              {/* Logged-in mobile view */}
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 ${
                    currentPage === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-blue-600/50'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div className="border-t border-blue-500/30 pt-4 mt-4">
                 <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-red-600/50 flex items-center gap-3"
                 >
                    <span>🚪</span>
                    Logout
                 </button>
              </div>
            </>
          ) : (
            <>
              {/* Logged-out mobile view */}
              <button onClick={() => handleNavClick('login')} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-blue-600/50 flex items-center gap-3">
                <span>🔐</span>
                Sign In
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;