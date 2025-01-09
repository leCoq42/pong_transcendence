import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('join')
  joinQueue(@Body() body: { playerId: string }) {
    const result = this.queueService.addPlayerToQueue(body.playerId);
    if (!result || result.message?.startsWith('Error:')) {
      throw new BadRequestException(result?.message || 'Invalid socket ID');
    }
    return result;
  }

  @Delete('leave/:playerId')
  leaveQueue(@Param('playerId') playerId: string) {
    return this.queueService.removePlayerFromQueue(playerId);
  }
}
