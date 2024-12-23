import React, { useState, useEffect } from "react";
import "./App.css";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import { connectSocket, disconnectSocket } from "./socket";
import { v4 as uuidv4 } from "uuid";

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState("");
  const [gameId, setGameId] = useState("");
  const [playerId, setPlayerId] = useState(uuidv4());

  useEffect(() => {
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleGameStart = (
    selectedGameMode: string,
    selectedGameId: string
  ) => {
    setGameMode(selectedGameMode);
    setGameId(selectedGameId);
    setGameStarted(true);
  };

  return (
    <div className="app">
      {!gameStarted && (
        <Lobby onGameStart={handleGameStart} playerId={playerId} />
      )}
      {gameStarted && (
        <Game gameMode={gameMode} gameId={gameId} playerId={playerId} />
      )}
    </div>
  );
};

export default App;
