import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getSocket,
  movePaddle,
  onGameStateUpdate,
  offGameStateUpdate,
  requestRematch,
} from "../socket";
import { joinGame } from "../socket";
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
  // speed: number;
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  // speed: number;
}

export interface GameState {
  player1: Player;
  player2: Player;
  ball: Ball;
  gameStarted: Date;
}

interface GameProps {
  gameMode: string;
  gameId: string;
  queueStatus: string;
  setQueueStatus: React.Dispatch<React.SetStateAction<string>>;
  onGameStart: (gameMode: string, gameId: string) => void;
}

const Game: React.FC<GameProps> = ({
  gameMode,
  gameId: initialGameId,
  queueStatus,
  setQueueStatus,
  onGameStart,
}) => {
  const [gameId, setGameId] = useState<string>(initialGameId);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keyRef = useRef<{ [key: string]: boolean }>({});
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
    if (gameMode === "localMultiplayer") {
      if (keyRef.current["w"]) {
        movePaddle(gameId, "up", 1);
      } else if (keyRef.current["s"]) {
        movePaddle(gameId, "down", 1);
      }
      if (keyRef.current["ArrowUp"]) {
        movePaddle(gameId, "up", 2);
      } else if (keyRef.current["ArrowDown"]) {
        movePaddle(gameId, "down", 2);
      }
    } else {
      if (keyRef.current["ArrowUp"]) {
        movePaddle(gameId, "up");
      } else if (keyRef.current["ArrowDown"]) {
        movePaddle(gameId, "down");
      }
    }

    animationFrameRef.current = requestAnimationFrame(processPaddleMovement);
  }, [gameId, gameMode]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("gameOver", (data: { winner: string }) => {
      setWinner(data.winner);
    });

    return () => {
      socket.off("gameOver");
    };
  }, []);

  const handleRematchClick = () => {
    setRematchRequested(true);
    requestRematch(gameId);
  };

  const handleServerRematch = useCallback(
    (rematchGameId: string) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setGameState(null);
      setGameId(rematchGameId);
      setWinner(null);
      setRematchRequested(false);
      setQueueStatus("inactive");

      setGameStarted(false);
      setTimeout(() => setGameStarted(true), 0);

      if (gameMode === "remoteMultiplayer") {
        joinGame(gameMode, rematchGameId, setQueueStatus, (newGameId) => {
          onGameStart(gameMode, newGameId);
        });
      }
    },
    [gameMode, onGameStart, setQueueStatus]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("rematchStarted", handleServerRematch);
    console.log("rematch start received");

    return () => {
      socket.off("rematchStarted", handleServerRematch);
    };
  }, [handleServerRematch]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

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
      }
    };
  }, [
    gameId,
    gameMode,
    gameStarted,
    gameState,
    handleKeyDown,
    handleKeyUp,
    processPaddleMovement,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState.player1 && gameState.player2) {
      drawPaddle(context, gameState.player1.paddle);
      drawPaddle(context, gameState.player2.paddle);
      drawBall(context, gameState.ball);
    }
  }, [gameState]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    return () => {};
  }, [gameId]);

  const drawPaddle = (context: CanvasRenderingContext2D, paddle: Paddle) => {
    context.fillStyle = "#FFF";
    context.fillRect(
      paddle.x * (canvasRef.current?.width || 1) * 0.01,
      paddle.y * (canvasRef.current?.height || 1) * 0.01,
      paddle.width * (canvasRef.current?.width || 1) * 0.01,
      paddle.height * (canvasRef.current?.height || 1) * 0.01
    );
  };

  const drawBall = (context: CanvasRenderingContext2D, ball: Ball) => {
    context.beginPath();
    context.arc(
      ball.x * (canvasRef.current?.width || 1) * 0.01,
      ball.y * (canvasRef.current?.height || 1) * 0.01,
      ball.radius * (canvasRef.current?.width || 1) * 0.01,
      0,
      Math.PI * 2
    );
    context.fillStyle = "#FFF";
    context.fill();
    context.closePath();
  };

  if (winner) {
    return (
      <div className="game-over">
        <h2>Game Over!</h2>
        <p>{winner === "player1" ? "Player 1" : "Player 2"} wins!</p>
        <button onClick={handleRematchClick} disabled={rematchRequested}>
          {rematchRequested ? "Rematch Requested" : "Rematch"}
        </button>
      </div>
    );
  } else {
    return (
      <div>
        <Scoreboard
          player1Score={gameState?.player1.score || 0}
          player2Score={gameState?.player2.score || 0}
        />
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ border: "1px solid white" }}
        />
      </div>
    );
  }
};

export default Game;
