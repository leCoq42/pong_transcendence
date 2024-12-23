import { Injectable } from '@nestjs/common';
import { GameState, Paddle, Ball } from './entities/game-state.entity';
import { v4 as uuid } from 'uuid';

const SERVER_TICKRATE = 1000 / 60;

@Injectable()
export class GameService {
  private games: Map<string, GameState> = new Map();
  private playerGameMap: Map<string, string> = new Map();

  private initializeGameState(): GameState {
    const initialPaddle: Paddle = {
      x: 0,
      y: 45,
      width: 2,
      height: 10,
      speed: 2,
    };

    const initialBall: Ball = {
      x: 50,
      y: 50,
      radius: 2,
      velocityX: 1,
      velocityY: 1,
      speed: 1,
    };

    return {
      player1: {
        id: '',
        paddle: { ...initialPaddle, x: 2 },
        score: 0,
      },
      player2: {
        id: '', // Add id for player2
        paddle: { ...initialPaddle, x: 96 },
        score: 0,
      },
      ball: initialBall,
      gameStarted: new Date(),
    };
  }

  createSinglePlayerGame(playerId: string): string {
    const gameId = uuid();
    const gameState = this.initializeGameState();
    this.games.set(gameId, gameState);
    this.playerGameMap.set(playerId, gameId);
    this.startGameLoop(gameId);
    return gameId;
  }

  createLocalMultiplayerGame(playerId: string): string {
    const gameId = uuid();
    const gameState = this.initializeGameState();
    gameState.player1.id = playerId;
    gameState.player2.id = uuid();
    this.games.set(gameId, gameState);
    this.playerGameMap.set(playerId, gameId);
    this.playerGameMap.set(gameState.player2.id, gameId); // Assign a temporary ID for the second player
    this.startGameLoop(gameId);
    return gameId;
  }

  addPlayerToGame(gameId: string, playerId: string): void {
    this.playerGameMap.set(playerId, gameId);
  }

  movePaddle(playerId: string, gameId: string, direction: 'up' | 'down') {
    const game = this.games.get(gameId);
    if (!game) return;

    const playerIndex = this.getPlayerIndex(playerId, gameId);
    if (playerIndex === -1) {
      throw new Error(`Player ${playerId} not found in game ${gameId}`);
    }

    const paddle =
      playerIndex === 0 ? game.player1.paddle : game.player2.paddle;

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

      this.updateGame(game);

      if (game.player1.score >= 7 || game.player2.score >= 7) {
        clearInterval(intervalId);
        this.games.delete(gameId);
        // Implement game over emit
      }
    }, SERVER_TICKRATE);
  }

  private updateGame(game: GameState) {
    const isSinglePlayer =
      Array.from(this.playerGameMap.values()).filter(
        (id) => id === game.player1.id,
      ).length === 1;

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
      this.resetBall(game.ball);
    } else if (game.ball.x + game.ball.radius > 100) {
      game.player1.score++;
      this.resetBall(game.ball);
    }
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

      // Adjust ball angle based on where it hits the paddle
      //   const collidePoint = ball.y - (paddle.y + paddle.height / 2);
      //   const normalizedCollidePoint = collidePoint / (paddle.height / 2);
      //   const angleRad = (Math.PI / 4) * normalizedCollidePoint;
      //   const direction = ball.x < 50 ? 1 : -1;
      //   ball.velocityX = direction * ball.speed * Math.cos(angleRad);
      //   ball.velocityY = ball.speed * Math.sin(angleRad);

      // Increase ball speed after each paddle hit
      ball.speed += 0.1;
    }
  }

  private resetBall(ball: Ball) {
    ball.x = 50;
    ball.y = 50;
    ball.velocityX = -ball.velocityX;
    ball.speed = 1;
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
