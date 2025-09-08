import { io } from 'socket.io-client';

let socket = null;
let isConnected = false;

export const connectSocket = () => {
  if (isConnected && socket) return;

  // Use your production URL
  socket = io('https://api.croslite.com.eg:3001', {
    transports: ['websocket', 'polling'],
    secure: true
  });

  socket.on('connect', () => {
    isConnected = true;
    console.log('Connected to server');
    
    // Send visitor information
    socket.emit('visitor-joined', {
      page: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language
    });
  });

  socket.on('disconnect', () => {
    isConnected = false;
    console.log('Disconnected from server');
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    isConnected = false;
  });

  // Activity tracking - send heartbeat every 30 seconds
  setInterval(() => {
    if (isConnected && socket) {
      socket.emit('visitor-activity');
    }
  }, 30000);

  // Track page changes
  let lastPathname = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== lastPathname && isConnected && socket) {
      lastPathname = window.location.pathname;
      socket.emit('visitor-activity', {
        page: window.location.pathname
      });
    }
  }, 1000);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    isConnected = false;
  }
};

export const getSocketStatus = () => {
  return isConnected;
};