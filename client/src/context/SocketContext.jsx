import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext'; // Your app's authentication context

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // Get the authenticated user from your context
  const socketRef = useRef(null);

  useEffect(() => {
    // Effect runs when the authenticated user changes
    if (user && user._id) {
      // Connect to the server if we have a user and there's no existing connection
      if (!socketRef.current) {
        const newSocket = io('https://skillswap-production-75d5.up.railway.app/'); // URL of your new backend server
        socketRef.current = newSocket;
        setSocket(newSocket);

        // Announce the user's presence to the server
        newSocket.emit('add_user', user._id);
      }
    } else {
      // If there's no user, disconnect the socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    }

    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [user]); // This effect depends on the user object

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

