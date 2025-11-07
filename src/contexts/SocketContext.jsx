import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import env from '../config/env';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const initializeSocket = () => {
      const token = localStorage.getItem('token');
      
      const socketInstance = io(env.SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        extraHeaders: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      // Connection event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        console.log('Socket auth:', socketInstance.auth);
        setIsConnected(true);
        setConnectionError(null);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.error('Socket connection error details:', {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type
        });
        setConnectionError(error.message);
        setIsConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        setConnectionError(error.message);
      });

      // Support-related event handlers
      socketInstance.on('query_updated', (data) => {
        console.log('Query updated:', data);
        // Handle query updates
        if (window.showNotification) {
          window.showNotification({
            type: 'info',
            message: `Your support query has been updated: ${data.status}`,
            duration: 5000
          });
        }
      });

      socketInstance.on('ticket_updated', (data) => {
        console.log('Ticket updated:', data);
        // Handle ticket updates
        if (window.showNotification) {
          window.showNotification({
            type: 'info',
            message: `Your support ticket ${data.ticketNumber} has been updated: ${data.status}`,
            duration: 5000
          });
        }
      });

      socketInstance.on('new_message', (data) => {
        console.log('New message received:', data);
        // Handle new chat messages
        if (window.showNotification) {
          window.showNotification({
            type: 'info',
            message: `New message from ${data.senderName}`,
            duration: 5000
          });
        }
      });

      socketInstance.on('user_joined', (data) => {
        console.log('User joined:', data);
        // Handle user joining chat
      });

      socketInstance.on('user_left', (data) => {
        console.log('User left:', data);
        // Handle user leaving chat
      });

      socketInstance.on('typing_start', (data) => {
        console.log('User typing:', data);
        // Handle typing indicators
      });

      socketInstance.on('typing_stop', (data) => {
        console.log('User stopped typing:', data);
        // Handle typing stop
      });

      socketInstance.on('messages_read', (data) => {
        console.log('Messages read:', data);
        // Handle read receipts
      });

      socketInstance.on('room_joined', (data) => {
        console.log('Room joined:', data);
        // Handle room join confirmation
      });

      socketInstance.on('pong', () => {
        // Handle ping/pong for connection health
      });

      // Handle admin query responses
      socketInstance.on('query_response_added', (data) => {
        console.log('Admin query response received:', data);
        // This will be handled by the SupportCenter component
      });

      // Handle admin ticket messages
      socketInstance.on('ticket_message_added', (data) => {
        console.log('Admin ticket message received:', data);
        // This will be handled by the SupportCenter component
      });

      // Handle query status updates
      socketInstance.on('query_status_updated', (data) => {
        console.log('Query status updated:', data);
        // This will be handled by the SupportCenter component
      });

      // Handle ticket status updates
      socketInstance.on('ticket_status_updated', (data) => {
        console.log('Ticket status updated:', data);
        // This will be handled by the SupportCenter component
      });

      // Test socket connection
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully:', socketInstance.id);
        console.log('Socket auth:', socketInstance.auth);
        console.log('Socket connected to:', env.SOCKET_URL);
      });

      setSocket(socketInstance);
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [user]);

  // Reconnect when user changes
  useEffect(() => {
    if (socket && user) {
      const token = localStorage.getItem('token');
      socket.auth = { token };
      socket.connect();
    }
  }, [user, socket]);

  // Socket utility functions
  const joinSupportRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('join_support_room', { roomId });
    }
  };

  const sendMessage = (roomId, message, messageType = 'text') => {
    if (socket && isConnected) {
      socket.emit('send_message', { roomId, message, messageType });
    }
  };

  const startTyping = (roomId) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { roomId });
    }
  };

  const markMessagesRead = (roomId) => {
    if (socket && isConnected) {
      socket.emit('mark_messages_read', { roomId });
    }
  };

  const ping = () => {
    if (socket && isConnected) {
      socket.emit('ping');
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    joinSupportRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesRead,
    ping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
