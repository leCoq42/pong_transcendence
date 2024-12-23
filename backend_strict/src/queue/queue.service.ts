import { Injectable } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { GameGateway } from '../game/game.gateway';

@Injectable()
export class QueueService {
  private queue: string[] = [];

  constructor(
    private readonly gameService: GameService,
    private readonly gameGateway: GameGateway,
  ) {}

  addPlayerToQueue(playerId: string) {
    if (!this.queue.includes(playerId)) {
      this.queue.push(playerId);
      this.tryMatchPlayers();
      return { message: 'Joined queue', playerId };
    }
    return { message: 'Error: Already in queue', playerId };
  }

  removePlayerFromQueue(playerId: string) {
    this.queue = this.queue.filter((id) => id !== playerId);
    return { message: 'Left queue', playerId };
  }

  private tryMatchPlayers() {
    if (this.queue.length >= 2) {
      const player1 = this.queue.shift();
      const player2 = this.queue.shift();

      if (!player1 || !player2) {
        return;
      }

      const gameId = this.gameService.createLocalMultiplayerGame(player1);
      this.gameService.addPlayerToGame(gameId, player2);

      this.gameGateway.server.to(player1).emit('matchFound', { gameId });
      this.gameGateway.server.to(player2).emit('matchFound', { gameId });
    }
  }
}
