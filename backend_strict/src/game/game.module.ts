import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [forwardRef(() => QueueModule)],
  providers: [
    {
      provide: GameService,
      useClass: GameService,
    },
    {
      provide: GameGateway,
      useClass: GameGateway,
    },
  ],
  exports: [GameService, GameGateway],
})
export class GameModule {}
