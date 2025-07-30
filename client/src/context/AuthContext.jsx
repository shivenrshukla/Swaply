// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null) // 1. Add state for the token
  const [loading, setLoading] = useState(true);

  // On mount, load user and token from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token') // 2. Load token from storage

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      setToken(savedToken)
    }
    setLoading(false)
  }, [])

  // 3. Update login to handle both user and token
  const login = (userData, tokenData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', tokenData)
    setUser(userData)
    setToken(tokenData)
  }

  // 4. Update logout to clear both user and token
  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }

  // 5. Provide the token in the context value
  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)