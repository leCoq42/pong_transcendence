import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  getSocket,
  movePaddle,
  onGameStateUpdate,
  offGameStateUpdate,
  requestRematch,
} from "../socket";
import Scoreboard from "./Scoreboard";

export interface Player {
  id: string;
  paddle: Paddle;
  score: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
}

export interface PowerUp {
  x: number;
  y: number;
  width: number;
}

export type GameMode =
  | "singleplayer"
  | "localMultiplayer"
  | "remoteMultiplayer";

export interface GameState {
  player1: Player;
  player2: Player;
  ball: Ball;
  gameStarted: Date;
  gameMode: GameMode;
  powerUp?: PowerUp;
}

interface CoordinateCache {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}

interface GameProps {
  gameMode: GameMode;
  gameId: string;
  setQueueStatus: React.Dispatch<React.SetStateAction<string>>;
  onGameStart: (gameMode: GameMode, gameId: string) => void;
}

const Game: React.FC<GameProps> = ({
  gameMode,
  gameId: initialGameId,
  setQueueStatus,
  onGameStart,
}) => {
  const [gameId, setGameId] = useState<string>(initialGameId);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchError, setRematchError] = useState<string | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keyRef = useRef<{ [key: string]: boolean }>({});
  const lastMoveTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const gameIdRef = useRef(gameId);

  useEffect(() => {
    gameIdRef.current = gameId;
  }, [gameId]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "w", "s"].includes(e.key)) {
      e.preventDefault();
    }
    keyRef.current[e.key] = true;
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keyRef.current[e.key] = false;
  }, []);

  const processPaddleMovement = useCallback(() => {
    const currentTime = Date.now();
    const moveInterval = 16;

    if (currentTime - lastMoveTimeRef.current >= moveInterval) {
      if (gameMode === "localMultiplayer") {
        const p1Up = keyRef.current["w"];
        const p1Down = keyRef.current["s"];
        const p2Up = keyRef.current["ArrowUp"];
        const p2Down = keyRef.current["ArrowDown"];

        if (p1Up && !p1Down) {
          movePaddle(gameId, "up", 1);
        } else if (p1Down && !p1Up) {
          movePaddle(gameId, "down", 1);
        }

        if (p2Up && !p2Down) {
          movePaddle(gameId, "up", 2);
        } else if (p2Down && !p2Up) {
          movePaddle(gameId, "down", 2);
        }
      } else {
        const up = keyRef.current["ArrowUp"];
        const down = keyRef.current["ArrowDown"];
        if (up && !down) {
          movePaddle(gameId, "up");
        } else if (down && !up) {
          movePaddle(gameId, "down");
        }
      }

      lastMoveTimeRef.current = currentTime;
    }

    animationFrameRef.current = requestAnimationFrame(processPaddleMovement);
  }, [gameId, gameMode]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(
      "gameOver",
      (data: { winner: string; rematchTimeout: number }) => {
        setWinner(data.winner);
        setTimeLeft(Math.ceil((data.rematchTimeout - Date.now()) / 1000));
      }
    );

    socket.on("playerDisconnected", () => {
      setOpponentDisconnected(true);
    });

    return () => {
      socket.off("gameOver");
      socket.off("playerDisconnected");
    };
  }, []);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleLeaveGame = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit("leaveGame", { gameId });
    }
    setQueueStatus("inactive");
    onGameStart("singleplayer", "");
  }, [gameId, setQueueStatus, onGameStart]);

  const handleRematchClick = () => {
    setRematchRequested(true);
    setRematchError(null);
    requestRematch(gameId, (errorMessage) => {
      setRematchRequested(false);
      setRematchError(errorMessage);
    });
  };

  const handleServerRematch = useCallback(
    (rematchGameId: string) => {
      console.log("rematch request received");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setGameState(null);
      setGameId(rematchGameId);
      setWinner(null);
      setRematchRequested(false);
      setQueueStatus("inactive");

      const socket = getSocket();
      if (socket) {
        socket.once("gameStarted", () => {
          onGameStateUpdate(setGameState);
          animationFrameRef.current = requestAnimationFrame(
            processPaddleMovement
          );
        });
      }
    },
    [processPaddleMovement, setQueueStatus]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("rematchStarted", handleServerRematch);
    return () => {
      socket.off("rematchStarted", handleServerRematch);
    };
  }, [handleServerRematch]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    onGameStateUpdate(setGameState);

    animationFrameRef.current = requestAnimationFrame(processPaddleMovement);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      offGameStateUpdate();

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [gameId, gameMode, handleKeyDown, handleKeyUp, processPaddleMovement]);

  const calculateCoordinates = useCallback(
    (
      entity: {
        x: number;
        y: number;
        width: number;
        height: number;
        radius?: number;
      },
      canvas: HTMLCanvasElement
    ): CoordinateCache => {
      return {
        x: entity.x * canvas.width * 0.01,
        y: entity.y * canvas.height * 0.01,
        width: entity.width * canvas.width * 0.01,
        height: entity.height * canvas.height * 0.01,
        ...(entity.radius && { radius: entity.radius * canvas.width * 0.01 }),
      };
    },
    []
  );

  const coordinates = useMemo(() => {
    if (!canvasRef.current || !gameState) return null;
    return {
      player1: calculateCoordinates(
        gameState.player1.paddle,
        canvasRef.current
      ),
      player2: calculateCoordinates(
        gameState.player2.paddle,
        canvasRef.current
      ),
      ball: calculateCoordinates(
        {
          ...gameState.ball,
          height: gameState.ball.radius * 2,
          width: gameState.ball.radius * 2,
        },
        canvasRef.current
      ),
      powerUp: gameState.powerUp
        ? {
            x: gameState.powerUp.x * canvasRef.current.width * 0.01,
            y: gameState.powerUp.y * canvasRef.current.height * 0.01,
            width: gameState.powerUp.width * canvasRef.current.width * 0.01,
            height: gameState.powerUp.width * canvasRef.current.width * 0.01,
          }
        : null,
    };
  }, [gameState, calculateCoordinates]);

  const drawPaddle = useCallback(
    (context: CanvasRenderingContext2D, coords: CoordinateCache) => {
      context.fillStyle = "#FFF";
      context.fillRect(coords.x, coords.y, coords.width, coords.height);
    },
    []
  );

  const drawBall = useCallback(
    (context: CanvasRenderingContext2D, coords: CoordinateCache) => {
      context.beginPath();
      context.arc(coords.x, coords.y, coords.radius!, 0, Math.PI * 2);
      context.fillStyle = "#FFF";
      context.fill();
      context.closePath();
    },
    []
  );

  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && coordinates && gameState) {
      const context = canvas.getContext("2d");
      if (!context) {
        console.error("Couldn't get canvas context");
        return;
      }

      context.fillStyle = "#000";
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (gameState.player1 && gameState.player2) {
        drawPaddle(context, coordinates.player1);
        drawPaddle(context, coordinates.player2);
        drawBall(context, coordinates.ball);
      }

      if (coordinates.powerUp && gameState.powerUp) {
        context.fillStyle = "#0F0";
        context.fillRect(
          coordinates.powerUp.x,
          coordinates.powerUp.y,
          coordinates.powerUp.width,
          coordinates.powerUp.height
        );
      }
    }
  }, [coordinates, gameState, drawPaddle, drawBall]);

  useEffect(() => {
    let frameId: number;

    const animate = () => {
      renderGame();
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [renderGame]);

  if (winner || opponentDisconnected) {
    return (
      <div className="game-over">
        {winner ? (
          <>
            <h2>Game Over!</h2>
            <p>{winner === "player1" ? "Player 1" : "Player 2"} wins!</p>
          </>
        ) : (
          <>
            <h2>Opponent Disconnected</h2>
            <p>Your opponent has left the game.</p>
          </>
        )}
        <div className="game-over-buttons">
          {!opponentDisconnected &&
            gameMode !== "remoteMultiplayer" &&
            timeLeft !== null &&
            timeLeft > 0 && (
              <>
                <button
                  onClick={handleRematchClick}
                  disabled={rematchRequested}
                >
                  {rematchRequested
                    ? "Rematch Requested"
                    : `Rematch (${timeLeft}s)`}
                </button>
                {rematchError && (
                  <p className="error-message">{rematchError}</p>
                )}
              </>
            )}
          <button onClick={handleLeaveGame}>Leave Game</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <Scoreboard
        player1Score={gameState?.player1.score || 0}
        player2Score={gameState?.player2.score || 0}
        player1Id={gameState?.player1.id || ""}
        player2Id={gameState?.player2.id || ""}
      />
      <canvas ref={canvasRef} width={800} height={600} />
    </div>
  );
};

export default Game;
