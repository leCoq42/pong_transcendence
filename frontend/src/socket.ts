import { io, Socket } from "socket.io-client";
import { GameState } from "./components/Game";

let socket: Socket | null = null;
const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const connectSocket = () => {
  if (!socket) {
    socket = io(VITE_API_URL, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
      forceNew: true,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    console.log("Socket disconnected");
    socket = null;
  }
};

export const getSocket = (): Socket => {
  if (!socket) {
    socket = connectSocket();
  }
  return socket;
};

export const onCountdown = (
  callback: (data: { gameId: string; duration: number }) => void
) => {
  socket?.on("countdown", callback);
};

export const offCountdown = () => {
  socket?.off("countdown");
};

export const onMatchFound = (callback: (data: { gameId: string }) => void) => {
  socket?.on("matchFound", callback);
};

export const offMatchFound = () => {
  socket?.off("matchFound");
};

export const onQueueStatus = (callback: (data: { status: string }) => void) => {
  socket?.on("queueStatus", callback);
};

export const offQueueStatus = () => {
  socket?.off("queueStatus");
};

export const joinGame = (
  gameMode: string,
  gameId: string | undefined,
  setQueueStatus: React.Dispatch<React.SetStateAction<string>>,
  callback: (gameId: string) => void
) => {
  socket?.emit("joinGame", { gameMode, gameId });
  if (gameMode === "remoteMultiplayer") {
    socket?.on("matchFound", (data) => {
      socket?.off("queueStatus");
      callback(data.gameId);
    });
    socket?.on("queueStatus", (data) => {
      setQueueStatus(data.status);
      console.log("Queue status:", data.status);
    });
  } else {
    socket?.on("gameStarted", callback);
  }
};

type PlayerKey = 'player1' | 'player2' | 'default';

const lastMoveTimes: Record<PlayerKey, number> = {
  player1: 0,
  player2: 0,
  default: 0
};
const MOVE_THROTTLE = 16;

export const movePaddle = (
  gameId: string,
  direction: "up" | "down",
  player?: number
) => {
  const now = performance.now();
  const playerKey: PlayerKey = player ? `player${player}` as PlayerKey : 'default';
  const lastTime = lastMoveTimes[playerKey];

  if (now - lastTime >= MOVE_THROTTLE) {
    const socket = getSocket();
    if (socket) {
      socket.emit("movePaddle", { gameId, direction, player });
      lastMoveTimes[playerKey] = now;
    }
  }
};

let lastGameStateTime = 0;
const STATE_UPDATE_THROTTLE = 16;

export const onGameStateUpdate = (callback: (gameState: GameState) => void) => {
  socket?.on("gameState", (gameState: GameState) => {
    const now = performance.now();
    if (now - lastGameStateTime >= STATE_UPDATE_THROTTLE) {
      callback(gameState);
      lastGameStateTime = now;
    }
  });
};

export const offGameStateUpdate = () => {
  socket?.off("gameState");
};

export const requestRematch = (gameId: string, onError?: (message: string) => void) => {
  const socket = getSocket();
  if (socket) {
    socket.emit("requestRematch", { gameId });
    
    socket.once("error", (data: { message: string }) => {
      if (onError) {
        onError(data.message);
      }
    });
  }
};

export const onRematchStarted = (callback: (gameId: string) => void) => {
  socket?.on("rematchStarted", callback);
};

export const offRematchStarted = () => {
  socket?.off("rematchStarted");
};
