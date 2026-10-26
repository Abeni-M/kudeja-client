import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

const socket = io(SOCKET_URL, {
  path: '/socket.io',
  withCredentials: true,
  autoConnect: true,
  transports: ['polling'],  // skip WebSocket upgrade attempts entirely
});

export default socket;