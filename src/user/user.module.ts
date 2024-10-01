import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FollowService } from 'src/follow/follow.service';
import { FeedService } from 'src/feed/feed.service';
import { PostService } from 'src/post/post.service';
import { LikesService } from 'src/likes/likes.service';
import { RepliesService } from 'src/replies/replies.service';
import { PollsService } from 'src/polls/polls.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    FollowService,
    LikesService,
    RepliesService,
    FeedService,
    PostService,
    PollsService,
  ],
})
export class UserModule {}
