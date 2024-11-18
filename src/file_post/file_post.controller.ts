import { Body, Controller, Param, Post } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FilePostService } from './file_post.service';

@Controller('file-post')
export class FilePostController {
  constructor(private filePostServices: FilePostService) {}

  @Post('/create-file-post')
  async createFilePost(@Body() data: Prisma.FilePostCreateInput) {
    this.filePostServices.createFilePost(data);
  }

  @Post('/like')
  async likeFilePost(@Body() data: Prisma.FilePostLikeUncheckedCreateInput) {
    this.filePostServices.likeFilePost(data);
  }

  @Post('/reply')
  async replyFilePost(@Body() data: Prisma.FilePostReplyCreateInput) {
    this.filePostServices.replyFilePost(data);
  }
}
