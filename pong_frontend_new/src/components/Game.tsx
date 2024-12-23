import React, { useState, useEffect, useRef } from 'react';
import {
  getSocket,
  movePaddle,
  onGameStateUpdate,
  offGameStateUpdate,
} from '../socket';
import Scoreboard from './Scoreboard';

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  speed: number;
}

export interface GameState {
  player1Paddle: Paddle;
  player2Paddle: Paddle;
  ball: Ball;
  player1Score: number;
  player2Score: number;
  gameStarted: Date;
}

interface GameProps {
  gameMode: string;
  gameId: string;
  playerId: string;
}

const Game: React.FC<GameProps> = ({ gameMode, gameId, playerId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameMode === 'localMultiplayer') {
        if (event.key === 'w') {
          movePaddle(gameId, 'up');
        } else if (event.key === 's') {
          movePaddle(gameId, 'down');
        } else if (event.key === 'ArrowUp') {
          movePaddle(gameId, 'up');
        } else if (event.key === 'ArrowDown') {
          movePaddle(gameId, 'down');
        }
      } else {
        if (event.key === 'ArrowUp') {
          movePaddle(gameId, 'up');
        } else if (event.key === 'ArrowDown') {
          movePaddle(gameId, 'down');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    onGameStateUpdate(setGameState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      offGameStateUpdate();
    };
  }, [gameId, gameMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Clear the canvas
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddles and ball
    drawPaddle(context, gameState.player1Paddle);
    drawPaddle(context, gameState.player2Paddle);
    drawBall(context, gameState.ball);
  }, [gameState]);

  const drawPaddle = (context: CanvasRenderingContext2D, paddle: Paddle) => {
    context.fillStyle = '#FFF';
    context.fillRect(
      paddle.x * (canvasRef.current?.width || 1) * 0.01,
      paddle.y * (canvasRef.current?.height || 1) * 0.01,
      paddle.width * (canvasRef.current?.width || 1) * 0.01,
      paddle.height * (canvasRef.current?.height || 1) * 0.01,
    );
  };

  const drawBall = (context: CanvasRenderingContext2D, ball: Ball) => {
    context.beginPath();
    context.arc(
      ball.x * (canvasRef.current?.width || 1) * 0.01,
      ball.y * (canvasRef.current?.height || 1) * 0.01,
      ball.radius * (canvasRef.current?.width || 1) * 0.01,
      0,
      Math.PI * 2,
    );
    context.fillStyle = '#FFF';
    context.fill();
    context.closePath();
  };

  return (
    <div>
      <Scoreboard
        player1Score={gameState?.player1Score || 0}
        player2Score={gameState?.player2Score || 0}
      />
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid white' }}
      />
    </div>
  );
};

export default Game;