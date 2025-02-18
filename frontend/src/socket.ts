import { io, Socket } from "socket.io-client";
import { GameState } from "./components/Game";

let socket: Socket | null = null;
const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const connectSocket = () => {
  if (!socket) {
    socket = io(VITE_API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
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

export const movePaddle = (
  gameId: string,
  direction: "up" | "down",
  player?: number
) => {
  const socket = getSocket();
  if (socket) {
    socket.emit("movePaddle", { gameId, direction, player });
  }
};

export const onGameStateUpdate = (callback: (gameState: GameState) => void) => {
  socket?.on("gameState", callback);
};

export const offGameStateUpdate = () => {
  socket?.off("gameState");
};

export const requestRematch = (gameId: string, onError?: (message: string) => void) => {
  const socket = getSocket();
  if (socket) {
    socket.emit("requestRematch", { gameId });
    
    // Listen for error events
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
