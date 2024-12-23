export interface Ball {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  speed: number;
}

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
  speed: number;
}

export interface GameState {
  player1: Player;
  player2: Player;
  ball: Ball;
  gameStarted: Date;
}
