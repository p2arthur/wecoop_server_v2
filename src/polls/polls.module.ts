import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { PollExpiryJob } from '../jobs/poll.jobs';
import { NotificationService } from '../notification/notification.service';

@Module({
  controllers: [PollsController],
  providers: [PollsService, PollExpiryJob, NotificationService],
})
export class PollsModule {}
