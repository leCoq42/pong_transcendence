import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('join')
  joinQueue(@Body() body: { playerId: string }) {
    return this.queueService.addPlayerToQueue(body.playerId);
  }

  @Delete('leave/:playerId')
  leaveQueue(@Param('playerId') playerId: string) {
    return this.queueService.removePlayerFromQueue(playerId);
  }
}
