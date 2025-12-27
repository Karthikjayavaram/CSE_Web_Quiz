import { io } from 'socket.io-client';

// Use production backend URL in production mode, localhost for development
const SOCKET_URL = import.meta.env.PROD
    ? 'https://quiz-event-backend.onrender.com'
    : 'http://localhost:5000';

console.log('Connecting to Socket.io server:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});
