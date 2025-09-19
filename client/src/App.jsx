// src/App.jsx
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import Navbar from './components/Navbar';
import { SocketProvider } from './context/SocketContext';

// Import pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import IncomingRequests from './components/IncomingRequests';
import SwapMatches from './components/SwapMatches';
import AdminPanel from './pages/AdminPanel';
import ManageUsers from './pages/ManageUsers';
import Announcements from './pages/Announcements';
import ModerateSkills from './pages/ModerateSkills';
import GetAnnouncements from './pages/GetAnnouncements';
import Chat from './pages/Chat';
function RenderPage() {
  const { currentPage }  = useNavigation();

  switch (currentPage) {
    case 'home': return <Home />;
    case 'login': return <Login />;
    case 'requests': return <IncomingRequests />;
    case 'register': return <Register />;
    case 'matches': return <SwapMatches />;
    case 'profile': return <Profile />;
    case 'admin': return <AdminPanel />;
    case 'manage-users': return <ManageUsers />;
    case 'announcements': return <Announcements />;
    case 'get-announcements': return <GetAnnouncements />
    case 'moderate-skills': return <ModerateSkills />;
    case 'chat': return <Chat/>
    default: return <Home />;
  }
}

function App() {
  
  const { currentPage, setCurrentPage } = useNavigation();

  return (
      <AuthProvider>
        <SocketProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900">
          <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
          <main><RenderPage /></main>
        </div>
        </SocketProvider>
      </AuthProvider>
  );
}

export default App;