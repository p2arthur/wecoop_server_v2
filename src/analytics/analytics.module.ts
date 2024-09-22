import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { FeedService } from 'src/feed/feed.service';
import { PostService } from 'src/post/post.service';
import { LikesService } from 'src/likes/likes.service';
import { RepliesService } from 'src/replies/replies.service';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    FeedService,
    PostService,
    LikesService,
    RepliesService,
  ],
})
export class AnalyticsModule {}
