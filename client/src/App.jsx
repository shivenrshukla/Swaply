// Contexts
import { AuthProvider } from './context/AuthContext';
import { useNavigation } from './context/NavigationContext';

// import Components
import Navbar from './components/Navbar';
import IncomingRequests from './components/IncomingRequests';
import SwapMatches from './components/SwapMatches';

// Import pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import ManageUsers from './pages/ManageUsers';
import Announcements from './pages/Announcements';
import ModerateSkills from './pages/ModerateSkills';
import GetAnnouncements from './pages/GetAnnouncements';
import Chat from './pages/Chat';
import DirectMessages from './pages/DirectMessages';

const routes = {
    login: Login,
    requests: IncomingRequests,
    register: Register,
    matches: SwapMatches,
    profile: Profile,
    admin: AdminPanel,
    'manage-users': ManageUsers,
    announcements: Announcements,
    'get-announcements': GetAnnouncements,
    'moderate-skills': ModerateSkills,
    chat: Chat,
    'direct-messages': DirectMessages,
    home: Home
  }

// Component to render the current page based on navigation state
function RenderPage() {
  const { currentPage }  = useNavigation();
  const Page = routes[currentPage] || Home;
  return <Page />;
}

// Main App component
function App() {
  const { currentPage, navigate } = useNavigation();

  return (
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900">
          <Navbar currentPage={currentPage} onPageChange={navigate} />
          <main>
            <RenderPage />
          </main>
        </div>
      </AuthProvider>
  );
}

export default App;