import { Injectable, Logger } from '@nestjs/common';
import {
  GameState,
  Paddle,
  Ball,
  GameMode,
} from './entities/game-state.entity';
import { v4 as uuid } from 'uuid';
import { Server } from 'socket.io';

const SERVER_TICKRATE = 1000 / 60;
const SCORE_LIMIT = 2;

@Injectable()
export class GameService {
  private server: Server | null = null;
  private rematchRequests: Map<string, string[]> = new Map();
  private games: Map<string, GameState> = new Map();
  private playerGameMap: Map<string, string> = new Map();
  private readonly logger = new Logger(GameService.name);

  setServer(server: Server) {
    this.server = server;
  }

  private initializeGameState(gameMode: GameMode): GameState {
    const initialPaddle: Paddle = {
      x: 0,
      y: 45,
      width: 2,
      height: 10,
      speed: 1,
    };

    const initialBall: Ball = {
      x: 50,
      y: 50,
      radius: 2,
      velocityX: 0.5,
      velocityY: 0.5,
      speed: 1,
    };

    return {
      player1: {
        id: '',
        paddle: { ...initialPaddle, x: 2 },
        score: 0,
        inGame: true,
      },
      player2: {
        id: '',
        paddle: { ...initialPaddle, x: 96 },
        score: 0,
        inGame: true,
      },
      ball: initialBall,
      gameStarted: new Date(),
      roundStartTime: Date.now(),
      gameMode,
    };
  }

  createSinglePlayerGame(playerId: string): string {
    const gameId = uuid();
    const gameState = this.initializeGameState('singleplayer');
    gameState.player1.id = playerId;
    this.games.set(gameId, gameState);
    this.playerGameMap.set(playerId, gameId);
    this.startGameLoop(gameId);
    return gameId;
  }

  createLocalMultiplayerGame(playerId: string): string {
    const gameId = uuid();
    const gameState = this.initializeGameState('localMultiplayer');
    gameState.player1.id = playerId;
    gameState.player2.id = uuid();
    this.games.set(gameId, gameState);
    this.playerGameMap.set(playerId, gameId);
    this.playerGameMap.set(gameState.player2.id, gameId);
    this.startGameLoop(gameId);
    return gameId;
  }

  createRemoteMultiplayerGame(player1Id: string, player2Id: string): string {
    const gameId = uuid();
    const gameState = this.initializeGameState('remoteMultiplayer');
    gameState.player1.id = player1Id;
    gameState.player2.id = player2Id;
    this.games.set(gameId, gameState);
    this.startGameLoop(gameId);
    return gameId;
  }

  addPlayerToGame(gameId: string, playerId: string): void {
    this.playerGameMap.set(playerId, gameId);
  }

  movePaddle(
    playerId: string,
    gameId: string,
    direction: 'up' | 'down',
    player?: number,
  ) {
    const game = this.games.get(gameId);
    if (!game) return;

    let paddle;
    if (player === 1) {
      paddle = game.player1.paddle;
    } else if (player === 2) {
      paddle = game.player2.paddle;
    } else {
      const playerIndex = this.getPlayerIndex(playerId, gameId);
      paddle = playerIndex === 0 ? game.player1.paddle : game.player2.paddle;
    }

    if (direction === 'up') {
      paddle.y -= paddle.speed;
    } else if (direction === 'down') {
      paddle.y += paddle.speed;
    }

    paddle.y = Math.max(0, Math.min(paddle.y, 100 - paddle.height));
  }

  getGameState(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  handleDisconnect(playerId: string) {
    const gameId = this.playerGameMap.get(playerId);
    if (gameId) {
      this.games.delete(gameId);
      this.playerGameMap.delete(playerId);
    }
  }

  private startGameLoop(gameId: string) {
    const intervalId = setInterval(() => {
      const game = this.games.get(gameId);
      if (!game) {
        clearInterval(intervalId);
        return;
      }

      this.updateGame(gameId, game);

      if (
        game.player1.score >= SCORE_LIMIT ||
        game.player2.score >= SCORE_LIMIT
      ) {
        const winner =
          game.player1.score >= SCORE_LIMIT ? 'player1' : 'player2';
        this.server?.to(gameId).emit('gameOver', { winner });
        clearInterval(intervalId);
        this.games.delete(gameId);
      }
    }, SERVER_TICKRATE);
  }

  private updateGame(gameId: string, game: GameState) {
    const now = Date.now();
    const isSinglePlayer = !game.player2.id;
    const roundStartTime = game.roundStartTime || now;

    if (!game.powerUp && now - roundStartTime >= 2000) {
      game.powerUp = {
        x: 20 + Math.random() * 60,
        y: Math.random() * 100,
        radius: 3,
        spawnTime: now,
      };
      game.lastPowerUpSpawn = now;
    }

    if (game.powerUp && now - game.powerUp.spawnTime >= 5000) {
      game.powerUp = undefined;
    }

    if (game.powerUp) {
      const dx = game.ball.x - game.powerUp.x;
      const dy = game.ball.y - game.powerUp.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < game.ball.radius + game.powerUp.radius) {
        const affectedPlayer =
          game.ball.velocityX > 0 ? game.player1 : game.player2;
        const originalHeight = 10;

        if (affectedPlayer.paddle.height === originalHeight) {
          affectedPlayer.paddle.height = originalHeight * 2;
          setTimeout(() => {
            if (this.games.has(gameId)) {
              const currentGame = this.games.get(gameId);
              if (currentGame) {
                affectedPlayer.paddle.height = originalHeight;
              }
            }
          }, 5000);
        }
        game.powerUp = undefined;
        game.lastPowerUpSpawn = now;
      }
    }

    if (isSinglePlayer) {
      this.moveBotPaddle(game.player2.paddle, game.ball);
    }

    game.ball.x += game.ball.velocityX;
    game.ball.y += game.ball.velocityY;

    if (
      game.ball.y + game.ball.radius > 100 ||
      game.ball.y - game.ball.radius < 0
    ) {
      game.ball.velocityY = -game.ball.velocityY;
    }

    this.checkPaddleCollision(game.player1.paddle, game.ball);
    this.checkPaddleCollision(game.player2.paddle, game.ball);

    if (game.ball.x - game.ball.radius < 0) {
      game.player2.score++;
      game.roundStartTime = this.resetBall(game.ball, game);
    } else if (game.ball.x + game.ball.radius > 100) {
      game.player1.score++;
      game.roundStartTime = this.resetBall(game.ball, game);
    }
    this.server?.to(gameId).emit('gameState', game);
  }

  private moveBotPaddle(paddle: Paddle, ball: Ball) {
    const paddleCenter = paddle.y + paddle.height / 2;
    if (paddleCenter < ball.y - 5) {
      paddle.y += paddle.speed;
    } else if (paddleCenter > ball.y + 5) {
      paddle.y -= paddle.speed;
    }
    paddle.y = Math.max(0, Math.min(paddle.y, 100 - paddle.height));
  }

  private checkPaddleCollision(paddle: Paddle, ball: Ball) {
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;

    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;

    if (
      ballRight > paddleLeft &&
      ballTop < paddleBottom &&
      ballLeft < paddleRight &&
      ballBottom > paddleTop
    ) {
      ball.velocityX = -ball.velocityX;

      const collidePoint = ball.y - (paddle.y + paddle.height / 2);
      const normalizedCollidePoint = collidePoint / (paddle.height / 2);
      const angleRad = (Math.PI / 4) * normalizedCollidePoint;
      const direction = ball.x < 50 ? 1 : -1;
      ball.velocityX = direction * ball.speed * Math.cos(angleRad);
      ball.velocityY = ball.speed * Math.sin(angleRad);
      ball.speed += 0.1;
    }
  }

  requestRematch(gameId: string, playerId: string) {
    const game = this.games.get(gameId);
    if (!game) {
      return { message: 'Game not found', gameId };
    }

    if (!this.rematchRequests.has(gameId)) {
      this.rematchRequests.set(gameId, []);
    }

    const requests = this.rematchRequests.get(gameId)!;
    if (!requests.includes(playerId)) {
      requests?.push(playerId);
    }

    const gameMode = game.gameMode;

    if (
      (gameMode === 'singleplayer' || gameMode === 'localMultiplayer') &&
      requests?.length >= 1
    ) {
      this.startRematch(gameId);
    } else if (gameMode === 'remoteMultiplayer' && requests?.length >= 2) {
      this.startRematch(gameId);
    }

    return { message: 'Rematch requested', gameId };
  }

  private startRematch(gameId: string) {
    const existingGame = this.games.get(gameId);
    if (!existingGame) {
      this.logger.error(`Game ID ${gameId} not found for rematch.`);
      return;
    }

    const newGameId = uuid();
    const gameMode = existingGame.gameMode;
    const gameState = this.initializeGameState(gameMode);

    if (gameMode === 'singleplayer') {
      gameState.player1.id = existingGame.player1.id;
      this.playerGameMap.set(existingGame.player1.id, newGameId);
    } else {
      gameState.player1.id = existingGame.player1.id;
      gameState.player2.id = existingGame.player2.id;
      this.playerGameMap.set(existingGame.player1.id, newGameId);
      this.playerGameMap.set(existingGame.player2.id, newGameId);
    }

    this.games.set(newGameId, gameState);
    this.rematchRequests.delete(gameId);

    this.startGameLoop(newGameId);
    this.server?.to(gameId).emit('rematchStarted', newGameId);
  }

  private resetBall(ball: Ball, game: GameState) {
    ball.x = 50;
    ball.y = 50;
    ball.velocityX = 0.5 * (ball.velocityX > 0 ? -1 : 1);
    ball.velocityY = 0.5 * (ball.velocityY > 0 ? -1 : 1);
    ball.speed = 1;

    game.powerUp = undefined;
    game.lastPowerUpSpawn = undefined;

    return Date.now();
  }

  private getPlayerIndex(playerId: string, gameId: string): number {
    const game = this.games.get(gameId);
    if (!game) return -1;

    let index = 0;
    for (const [key, value] of this.playerGameMap) {
      if (value === gameId) {
        if (key === playerId) {
          return index;
        }
        index++;
      }
    }
    return -1;
  }
}
