import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { GameModule } from 'src/game/game.module';

@Module({
  imports: [GameModule],
  providers: [QueueService],
  controllers: [QueueController],
})
export class QueueModule {}
