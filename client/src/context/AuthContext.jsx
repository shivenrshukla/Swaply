// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect , useMemo, useCallback} from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // 1. Add state for the token
  const [loading, setLoading] = useState(true);

  // On mount, load user and token from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token'); // 2. Load token from storage

    // Get User object from localStorage if token and user exist
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  // Update login to handle both user and token
  const login = useCallback((userData, tokenData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
    setUser(userData);
    setToken(tokenData);
  }, []);

  // Update logout to clear both user and token
  const logout = useCallback(() => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }, []);

  const updateUser = useCallback((newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    setUser: updateUser,
    login,
    logout
  }), [user, token, loading, updateUser, login, logout]);

  // Provide the token in the context value
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);