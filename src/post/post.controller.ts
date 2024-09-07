import { Controller, Get, Param } from '@nestjs/common';
import { PostService } from './post.service';
import { json } from 'stream/consumers';

@Controller('post')
export class PostController {
  constructor(private postServices: PostService) {}

  @Get('/:postTransactionId')
  async getPostByTransactionId(
    @Param('postTransactionId') postTransactionId: string,
  ) {
    const data = this.postServices.getPostByTransactionId(postTransactionId);

    return data;
  }
}
