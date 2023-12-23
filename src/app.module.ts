import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { LikesModule } from './likes/likes.module';
import { RepliesModule } from './replies/replies.module';
import { FollowModule } from './follow/follow.module';

@Module({
  imports: [PostsModule, UserModule, PostModule, LikesModule, RepliesModule, FollowModule],
})
export class AppModule {}
