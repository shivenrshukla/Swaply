import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Pages
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Profile from '../pages/Profile'
import UserDetails from '../pages/UserDetails'
import SwapRequests from '../pages/SwapRequests'
import Chat from '../pages/Chat'
import AdminPanel from '../pages/AdminPanel'
import AdminAnnouncements from '../pages/AdminAnnouncements'
import AdminExport from '../pages/AdminExport'

const AppRoutes = () => {
  const { user } = useAuth()

  // Admin-only route - FIXED: Check isAdmin instead of role
  const AdminRoute = ({ children }) => {
    return user?.isAdmin ? children : <Navigate to="/" />
  }

  // Authenticated-only route
  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/user/:id" element={<UserDetails />} />

      {/* Authenticated Users */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/swaps"
        element={
          <PrivateRoute>
            <SwapRequests />
          </PrivateRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        }
      />

      {/* Admin-only */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <AdminRoute>
            <AdminAnnouncements />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/export"
        element={
          <AdminRoute>
            <AdminExport />
          </AdminRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default AppRoutes
