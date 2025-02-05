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
  inGame: boolean;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface PowerUp {
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
}

export type GameMode =
  | 'singleplayer'
  | 'localMultiplayer'
  | 'remoteMultiplayer';

export interface GameState {
  player1: Player;
  player2: Player;
  ball: Ball;
  gameStarted: Date;
  gameMode: GameMode;
  powerUp?: PowerUp;
  lastPowerUpSpawn?: number;
  roundStartTime?: number;
}
