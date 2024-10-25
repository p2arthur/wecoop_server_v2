import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { LikesModule } from './likes/likes.module';
import { RepliesModule } from './replies/replies.module';
import { FollowModule } from './follow/follow.module';
import { FeedModule } from './feed/feed.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { PollsModule } from './polls/polls.module';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from './infra/modules/data.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PollExpiryJob } from './jobs/poll.jobs';
import { NotificationModule } from './notification/notification.module';
import { NotificationService } from './notification/notification.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    UserModule,
    PostModule,
    LikesModule,
    RepliesModule,
    FollowModule,
    FeedModule,
    AnalyticsModule,
    LeaderboardModule,
    PollsModule,
    DataModule,
    NotificationModule,
  ],
  providers: [PollExpiryJob, NotificationService],
})
export class AppModule {}
