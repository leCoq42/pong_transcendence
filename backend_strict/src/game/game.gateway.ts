import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { MovePaddleDto } from './dto/move-paddle.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.gameService.handleDisconnect(client.id);
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinGameDto,
  ) {
    if (data.gameMode === 'singleplayer') {
      const gameId = this.gameService.createSinglePlayerGame(client.id);
      client.join(gameId);
      this.server.to(gameId).emit('gameStarted', gameId);
    } else if (data.gameMode === 'localMultiplayer') {
      const gameId = this.gameService.createLocalMultiplayerGame(client.id);
      client.join(gameId);
      this.server.to(gameId).emit('gameStarted', gameId);
    } else if (data.gameMode === 'remoteMultiplayer' && data.gameId) {
      client.join(data.gameId);
      this.gameService.addPlayerToGame(data.gameId, client.id);
      this.server.to(data.gameId).emit('gameStarted', data.gameId);
    }
  }

  @SubscribeMessage('movePaddle')
  handleMovePaddle(
    @ConnectedSocket() client: Socket,
    @MessageBody() MovePaddleDto: MovePaddleDto,
  ) {
    const { gameId, direction } = MovePaddleDto;
    this.gameService.movePaddle(client.id, gameId, direction);
  }

  @SubscribeMessage('getGameState')
  handleGetGameState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    const gameState = this.gameService.getGameState(data.gameId);
    client.emit('gameState', gameState);
  }
}
