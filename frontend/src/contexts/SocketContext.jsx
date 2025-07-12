import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(undefined);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    if (token && user) {
      // Initialize socket connection
      socketRef.current = io('http://localhost:5000', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      const socket = socketRef.current;

      // Connection events
      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Cleanup on unmount
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    } else {
      // Disconnect if no token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    }
  }, [token, user]);

  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 