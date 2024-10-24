import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { PollExpiryJob } from '../jobs/poll.jobs';

@Module({
  controllers: [PollsController],
  providers: [PollsService, PollExpiryJob],
})
export class PollsModule {}
