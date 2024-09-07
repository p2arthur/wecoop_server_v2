import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { LikesService } from '../likes/likes.service';
import { RepliesService } from 'src/replies/replies.service';

@Module({
  controllers: [PostController],
  providers: [PostService, LikesService, RepliesService],
})
export class PostModule {}
