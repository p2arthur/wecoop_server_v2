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
    const data = await this.postServices.getPostByTransactionId(
      'L42BURVVB6Z6CVTHRAM4XBISMYHBSGACK6KELPVHNCX6HSYBVSDQ',
    );

    console.log('data', data);

    return data;
  }
}
