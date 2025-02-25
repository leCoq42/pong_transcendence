import React, { useState, useEffect } from "react";
import { joinQueue, leaveQueue } from "../api";
import { GameMode } from "./Game";
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
  onGameStart: (gameMode: GameMode, gameId: string) => void;
  queueStatus: string;
  setQueueStatus: React.Dispatch<React.SetStateAction<string>>;
}

const Lobby: React.FC<LobbyProps> = ({
  onGameStart,
  queueStatus,
  setQueueStatus,
}) => {
  const [playerId, setPlayerId] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode>("singleplayer");

  useEffect(() => {
    const handleCountdown = (data: { gameId: string; duration: number }) => {
      setQueueStatus("matched");
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
      onGameStart("remoteMultiplayer" as GameMode, data.gameId);
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

  const handleJoinQueue = async (gameMode: GameMode) => {
    setSelectedMode(gameMode);
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
    setSelectedMode("singleplayer");
  };

  return (
    <div>
      {queueStatus === "inactive" && selectedMode !== "remoteMultiplayer" && (
        <>
          <h2>Select Game Mode</h2>
          <button onClick={() => handleJoinQueue("singleplayer" as GameMode)}>
            Single Player
          </button>
          <button
            onClick={() => handleJoinQueue("localMultiplayer" as GameMode)}
          >
            Local Multiplayer
          </button>
          <button onClick={() => setSelectedMode("remoteMultiplayer")}>
            Remote Multiplayer
          </button>
        </>
      )}

      {selectedMode === "remoteMultiplayer" && (
        <div className="queue-controls">
          {queueStatus === "inactive" && (
            <>
              <h2>Remote Multiplayer</h2>
              <button
                onClick={() => handleJoinQueue("remoteMultiplayer" as GameMode)}
                disabled={queueStatus !== "inactive" && queueStatus !== "idle"}
              >
                Join Queue
              </button>
              <button
                onClick={() => {
                  setSelectedMode("singleplayer");
                  setQueueStatus("inactive");
                }}
              >
                Leave
              </button>
            </>
          )}
          {queueStatus === "inQueue" && countdown === null && (
            <button onClick={handleLeaveQueue}>Leave Queue</button>
          )}
          {queueStatus && <p>Status: {queueStatus}</p>}
        </div>
      )}
      {countdown !== null && <p>Game starts in: {countdown}</p>}
    </div>
  );
};

export default Lobby;
