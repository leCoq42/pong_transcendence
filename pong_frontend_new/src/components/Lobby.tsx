import React, { useState } from "react";
import { joinQueue, leaveQueue } from "../api";
import { joinGame } from "../socket";

interface LobbyProps {
  onGameStart: (gameMode: string, gameId: string) => void;
  playerId: string;
}

const Lobby: React.FC<LobbyProps> = ({ onGameStart, playerId }) => {
  const [queueStatus, setQueueStatus] = useState<string>("idle");

  const handleJoinQueue = async (gameMode: string) => {
    if (gameMode === "remoteMultiplayer") {
      setQueueStatus("joining");
      const response = await joinQueue(playerId);
      console.log(response);
      setQueueStatus("inQueue");
      joinGame(gameMode, undefined, (gameId) => {
        onGameStart(gameMode, gameId);
      });
    } else {
      joinGame(gameMode, undefined, (gameId) => {
        onGameStart(gameMode, gameId);
      });
    }
  };

  const handleLeaveQueue = async () => {
    setQueueStatus("leaving");
    const response = await leaveQueue(playerId);
    console.log(response);
    setQueueStatus("idle");
  };

  return (
    <div>
      <h2>Select Game Mode</h2>
      <button onClick={() => handleJoinQueue("singleplayer")}>
        Single Player
      </button>
      <button onClick={() => handleJoinQueue("localMultiplayer")}>
        Local Multiplayer
      </button>
      <button
        onClick={() => handleJoinQueue("remoteMultiplayer")}
        disabled={queueStatus !== "idle"}
      >
        Remote Multiplayer
      </button>
      {queueStatus === "inQueue" && (
        <button onClick={handleLeaveQueue} disabled={queueStatus !== "inQueue"}>
          Leave Queue
        </button>
      )}
      <p>Queue Status: {queueStatus}</p>
    </div>
  );
};

export default Lobby;
