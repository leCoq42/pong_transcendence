import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { GameModule } from 'src/game/game.module';

@Module({
  imports: [
    forwardRef(() => GameModule), // Import GameModule with forwardRef
  ],
  providers: [QueueService],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule {}
