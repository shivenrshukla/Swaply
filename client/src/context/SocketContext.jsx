// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    // Connect to your backend Socket.IO server (adjust URL)
    const newSocket = io(import.meta.env.VITE_API_URL)
    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      newSocket.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const socket = useContext(SocketContext)
  if (!socket) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return socket
}
