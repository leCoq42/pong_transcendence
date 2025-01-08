import React, { useState, useEffect } from "react";
import { joinQueue, leaveQueue } from "../api";
import {
  getSocket,
  joinGame,
  onCountdown,
  offCountdown,
  onMatchFound,
  offMatchFound,
} from "../socket";

interface LobbyProps {
  onGameStart: (gameMode: string, gameId: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onGameStart }) => {
  const [queueStatus, setQueueStatus] = useState<string | undefined>(undefined);
  const [playerId, setPlayerId] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleCountdown = (data: { gameId: string; duration: number }) => {
      setCountdown(data.duration);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev && prev > 1) {
            return prev - 1;
          } else {
            clearInterval(interval);
            setCountdown(null);
            return null;
          }
        });
      }, 1000);
    };

    const handleMatchFound = (data: { gameId: string }) => {
      onGameStart("remoteMultiplayer", data.gameId);
    };

    onCountdown(handleCountdown);
    onMatchFound(handleMatchFound);

    return () => {
      offCountdown();
      offMatchFound();
    };
  }, [onGameStart]);

  const handleJoinQueue = async (gameMode: string) => {
    if (gameMode === "remoteMultiplayer") {
      const socket = getSocket();
      if (!socket || !socket.id) return;

      setPlayerId(socket.id);
      setQueueStatus("joining");

      joinGame(gameMode, undefined, (gameId) => {
        setQueueStatus("inQueue");
      });

      const response = await joinQueue(socket.id);
      console.log(response);

      if (response.message === "Joined queue") {
        setQueueStatus("inQueue");
      }
    } else {
      joinGame(gameMode, undefined, (gameId) => {
        onGameStart(gameMode, gameId);
      });
    }
  };

  const handleLeaveQueue = async () => {
    setQueueStatus("leaving");
    if (playerId) {
      const response = await leaveQueue(playerId);
      console.log(response);
    }
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
        disabled={queueStatus !== undefined && queueStatus !== "idle"}
      >
        Remote Multiplayer
      </button>
      {queueStatus === "inQueue" && (
        <button onClick={handleLeaveQueue} disabled={queueStatus !== "inQueue"}>
          Leave Queue
        </button>
      )}
      {queueStatus && <p>Queue Status: {queueStatus}</p>}
      {countdown !== null && <p>Game starts in: {countdown}</p>}
    </div>
  );
};

export default Lobby;
