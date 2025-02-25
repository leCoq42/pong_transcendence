import React, { useState, useEffect } from "react";
import "./App.css";
import Lobby from "./components/Lobby";
import Game, { GameMode } from "./components/Game";
import { connectSocket, disconnectSocket } from "./socket";

interface SocketStatusProps {
  isConnected: boolean;
  socketId: string | null;
}

const SocketStatus: React.FC<SocketStatusProps> = ({ isConnected, socketId }) => (
  <div className="socket-status">
    {isConnected ? (
      <span className="status-connected">
        Connected {socketId && `(ID: ${socketId})`}
      </span>
    ) : (
      <span className="status-disconnected">Disconnected</span>
    )}
  </div>
);

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("singleplayer");
  const [gameId, setGameId] = useState("");
  const [queueStatus, setQueueStatus] = useState("inactive");
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    console.log("Connecting socket...");
    const socket = connectSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket?.id || null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    socket?.on("connect", handleConnect);
    socket?.on("disconnect", handleDisconnect);

    if (socket?.connected) {
      handleConnect();
    }

    return () => {
      socket?.off("connect", handleConnect);
      socket?.off("disconnect", handleDisconnect);
      disconnectSocket();
    };
  }, []);

  const handleGameStart = (
    selectedGameMode: GameMode,
    selectedGameId: string
  ) => {
    setGameMode(selectedGameMode);
    setGameId(selectedGameId);
    setGameStarted(selectedGameId !== "");
  };

  return (
    <div className="app">
      <SocketStatus isConnected={isConnected} socketId={socketId} />
      {!gameStarted && (
        <Lobby
          onGameStart={handleGameStart}
          queueStatus={queueStatus}
          setQueueStatus={setQueueStatus}
        />
      )}
      {gameStarted && (
        <Game
          gameMode={gameMode}
          gameId={gameId}
          setQueueStatus={setQueueStatus}
          onGameStart={handleGameStart}
        />
      )}
    </div>
  );
};

export default App;
