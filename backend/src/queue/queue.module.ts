import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { GameModule } from 'src/game/game.module';

@Module({
  imports: [forwardRef(() => GameModule)],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
