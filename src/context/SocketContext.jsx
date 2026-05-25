import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (socketRef.current) return;

    // Determine the base URL for socket.io (removing /api if it's there)
    let baseUrl;
    try {
      const url = new URL(API_BASE);
      // Ensure we use wss if the API is on https, or if we are currently on https
      const protocol = (url.protocol === 'https:' || window.location.protocol === 'https:') ? 'https:' : 'http:';
      baseUrl = `${protocol}//${url.host}`;
    } catch (e) {
      console.error("Invalid API_URL for socket:", API_BASE);
      baseUrl = window.location.origin.replace('http', 'ws'); // Fallback logic
    }
    
    const token = localStorage.getItem('dalti_access_token');
    
    console.log('Initializing WebSocket at:', baseUrl);
    const newSocket = io(baseUrl, {
      reconnectionDelayMax: 10000,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      secure: window.location.protocol === 'https:',
      rejectUnauthorized: false, // Often needed for dev environments with self-signed certs
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
