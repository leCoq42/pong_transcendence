import React, { useState, useEffect } from "react";
import { joinQueue, leaveQueue } from "../api";
import {
  getSocket,
  joinGame,
  onCountdown,
  offCountdown,
  onMatchFound,
  offMatchFound,
  onQueueStatus,
} from "../socket";

interface LobbyProps {
  onGameStart: (gameMode: string, gameId: string) => void;
  queueStatus: string;
  setQueueStatus: (status: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({
  onGameStart,
  queueStatus,
  setQueueStatus,
}) => {
  const [playerId, setPlayerId] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
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

    const handleQueueStatus = (data: { status: string }) => {
      setQueueStatus(data.status);
    };

    onCountdown(handleCountdown);
    onMatchFound(handleMatchFound);
    onQueueStatus(handleQueueStatus);

    return () => {
      offCountdown();
      offMatchFound();
    };
  }, [onGameStart]);

  const handleJoinQueue = async (gameMode: string) => {
    if (gameMode === "remoteMultiplayer") {
      const socket = getSocket();
      if (!socket || !socket.id) {
        console.log("socket error");
        return;
      }

      setPlayerId(socket.id);
      setQueueStatus("joining");

      const response = await joinQueue(socket.id);
      if (response.message === "Joined queue") {
        console.log(response);
        setQueueStatus("inQueue");
      }
    } else {
      joinGame(gameMode, undefined, setQueueStatus, (gameId) => {
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
    setQueueStatus("inactive");
  };

  return (
    <div>
      {queueStatus === "inactive" && (
        <>
          <h2>Select Game Mode</h2>
          <button onClick={() => handleJoinQueue("singleplayer")}>
            Single Player
          </button>
          <button onClick={() => handleJoinQueue("localMultiplayer")}>
            Local Multiplayer
          </button>
          <button
            onClick={() => handleJoinQueue("remoteMultiplayer")}
            disabled={queueStatus !== "inactive" && queueStatus !== "idle"}
          >
            Remote Multiplayer
          </button>
        </>
      )}
      {queueStatus === "inQueue" && (
        <button onClick={handleLeaveQueue}>Leave Queue</button>
      )}
      {queueStatus && <p>Queue Status: {queueStatus}</p>}
      {countdown !== null && <p>Game starts in: {countdown}</p>}
    </div>
  );
};

export default Lobby;
