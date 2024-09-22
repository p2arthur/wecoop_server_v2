import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { FeedModule } from '../feed/feed.module';
import { LikesModule } from '../likes/likes.module';
import { RepliesModule } from '../replies/replies.module';
import { FeedService } from 'src/feed/feed.service';
import { LikesService } from 'src/likes/likes.service';
import { RepliesService } from 'src/replies/replies.service';
import { PostService } from 'src/post/post.service';

@Module({
  imports: [FeedModule, LikesModule, RepliesModule],
  providers: [
    LeaderboardService,
    FeedService,
    LikesService,
    RepliesService,
    PostService,
  ],
  controllers: [LeaderboardController],
})
export class LeaderboardModule {}
