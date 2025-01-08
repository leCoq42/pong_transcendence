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
    const socket = this.gameGateway.connectedSockets.get(playerId);
    if (!socket) {
      return { message: 'Error: Invalid socket ID', playerId };
    }

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

      const gameId = this.gameService.createRemoteMultiplayerGame(
        player1,
        player2,
      );
      this.gameService.addPlayerToGame(gameId, player2);

      const socket1 = this.gameGateway.connectedSockets.get(player1);
      const socket2 = this.gameGateway.connectedSockets.get(player2);

      if (socket1) socket1.join(gameId);
      if (socket2) socket2.join(gameId);

      this.gameGateway.server
        .to([player1, player2])
        .emit('countdown', { gameId, duration: 3 });

      setTimeout(() => {
        this.gameGateway.server.to(gameId).emit('matchFound', { gameId });
      }, 3000);
    }
  }
}
