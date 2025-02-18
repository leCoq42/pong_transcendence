import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { QueueModule } from '../queue/queue.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Match } from './entities/match.entity';

@Module({
  imports: [forwardRef(() => QueueModule), SequelizeModule.forFeature([Match])],
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
