import { io } from 'socket.io-client';

// Use production backend URL from environment variable, fallback to localhost for development
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

console.log('Connecting to Socket.io server:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});
