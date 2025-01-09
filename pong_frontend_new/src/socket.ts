import { io, Socket } from "socket.io-client";
import { GameState } from "./components/Game";

const SOCKET_URL = "http://localhost:3000";

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

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io("http://localhost:3000", {
      withCredentials: true,
    });
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

export const joinGame = (
  gameMode: string,
  gameId: string | undefined,
  callback: (gameId: string) => void
) => {
  socket?.emit("joinGame", { gameMode, gameId });
  if (gameMode === "remoteMultiplayer") {
    socket?.on("matchFound", (data) => {
      socket?.off("queueStatus");
      callback(data.gameId);
    });
    socket?.on("queueStatus", (data) => {
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

export const requestRematch = (gameId: string) => {
  const socket = getSocket();
  if (socket) {
    socket.emit("requestRematch", { gameId });
  }
};

export const onRematchStarted = (callback: (gameId: string) => void) => {
  socket?.on("rematchStarted", callback);
};

export const offRematchStarted = () => {
  socket?.off("rematchStarted");
};
