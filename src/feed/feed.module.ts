import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { PostService } from 'src/post/post.service';
import { LikesService } from 'src/likes/likes.service';
import { RepliesService } from 'src/replies/replies.service';
import { UserService } from 'src/user/user.service';
import { FeedController } from './feed.controller';
import { FollowService } from 'src/follow/follow.service';
import { PostModule } from 'src/post/post.module';

@Module({
  imports: [PostModule],
  controllers: [FeedController],
  providers: [
    FeedService,
    PostService,
    LikesService,
    RepliesService,
    UserService,
    FollowService,
  ],
})
export class FeedModule {}
