import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { MovePaddleDto } from './dto/move-paddle.dto';
import { JoinGameDto } from './dto/joinGame.dto';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(GameGateway.name);
  @WebSocketServer()
  server: Server;

  public connectedSockets = new Map<string, Socket>();

  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
  ) {}

  afterInit(server: Server) {
    this.logger.log(`Server initiated`);
    this.gameService.setServer(server);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedSockets.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedSockets.delete(client.id);
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
    } else if (data.gameMode === 'remoteMultiplayer') {
      client.emit('queueStatus', { status: 'waiting' });
    }
  }

  @SubscribeMessage('movePaddle')
  handleMovePaddle(
    @ConnectedSocket() client: Socket,
    @MessageBody() MovePaddleDto: MovePaddleDto,
  ) {
    const { gameId, direction, player } = MovePaddleDto;
    this.gameService.movePaddle(client.id, gameId, direction, player);
  }

  @SubscribeMessage('getGameState')
  handleGetGameState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    const gameState = this.gameService.getGameState(data.gameId);
    client.emit('gameState', gameState);
  }

  @SubscribeMessage('requestRematch')
  handleRequestRematch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    return this.gameService.requestRematch(data.gameId, client.id);
  }
}
