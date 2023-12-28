import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { LikesModule } from './likes/likes.module';
import { RepliesModule } from './replies/replies.module';
import { FollowModule } from './follow/follow.module';
import { FeedModule } from './feed/feed.module';

@Module({
  imports: [
    FeedModule,
    UserModule,
    PostModule,
    LikesModule,
    RepliesModule,
    FollowModule,
  ],
})
export class AppModule {}
