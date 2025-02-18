import React, { useState, useEffect } from "react";
import "./App.css";
import Lobby from "./components/Lobby";
import Game, { GameMode } from "./components/Game";
import { connectSocket, disconnectSocket } from "./socket";

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("singleplayer");
  const [gameId, setGameId] = useState("");
  const [queueStatus, setQueueStatus] = useState("inactive");

  useEffect(() => {
    console.log("Connecting socket...");
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleGameStart = (
    selectedGameMode: GameMode,
    selectedGameId: string
  ) => {
    setGameMode(selectedGameMode);
    setGameId(selectedGameId);
    setGameStarted(true);
  };

  return (
    <div className="app">
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
          queueStatus={queueStatus}
          setQueueStatus={setQueueStatus}
          onGameStart={handleGameStart}
        />
      )}
    </div>
  );
};

export default App;
