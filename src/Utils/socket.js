import { io } from 'socket.io-client';

const SERVER_URL = 'http://192.168.0.106:5000';

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: false,
});

export default socket;