// src/App.jsx
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

// Import pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import IncomingRequests from './components/IncomingRequests';
import SwapMatches from './components/SwapMatches';
import AdminPanel from './pages/AdminPanel';

// Import NEW admin pages
import ManageUsers from './pages/ManageUsers';
import Announcements from './pages/Announcements';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onPageChange={setCurrentPage} />;
      case 'login':
        return <Login onPageChange={setCurrentPage} />;
      case 'requests':
        return <IncomingRequests />;
      case 'register':
        return <Register onPageChange={setCurrentPage} />;
      case 'matches':
        return <SwapMatches />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return <AdminPanel onPageChange={setCurrentPage} />;

      // Add cases for the new admin pages
      case 'manage-users':
        return <ManageUsers onPageChange={setCurrentPage} />;
      case 'announcements':
        return <Announcements onPageChange={setCurrentPage} />;
        
      default:
        return <Home onPageChange={setCurrentPage} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900">
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
        <main>{renderPage()}</main>
      </div>
    </AuthProvider>
  );
}

export default App;