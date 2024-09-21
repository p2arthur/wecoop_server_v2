import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { LikesModule } from './likes/likes.module';
import { RepliesModule } from './replies/replies.module';
import { FollowModule } from './follow/follow.module';
import { FeedModule } from './feed/feed.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';

@Module({
  imports: [
    UserModule,
    PostModule,
    LikesModule,
    RepliesModule,
    FollowModule,
    FeedModule,
    AnalyticsModule,
    LeaderboardModule,
  ],
})
export class AppModule {}
