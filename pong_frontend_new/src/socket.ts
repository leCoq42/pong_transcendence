import { io, Socket } from 'socket.io-client';
import { GameState } from './components/Game';

const SOCKET_URL = 'http://localhost:3000';

let socket: Socket | null = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinGame = (
  gameMode: string,
  gameId: string | undefined,
  callback: (gameId: string) => void,
) => {
  socket?.emit('joinGame', { gameMode, gameId });
  socket?.on('gameStarted', callback);
};

export const movePaddle = (gameId: string, direction: 'up' | 'down') => {
  socket?.emit('movePaddle', { gameId, direction });
};

export const onGameStateUpdate = (callback: (gameState: GameState) => void) => {
  socket?.on('gameState', callback);
};

export const offGameStateUpdate = () => {
  socket?.off('gameState');
};