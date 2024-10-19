import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PostService } from './post.service';
import { json } from 'stream/consumers';
import { Prisma } from '@prisma/client';

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
  @Post()
  async create(@Body() data: Prisma.PostCreateInput) {
    return this.postServices.createPost(data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postServices.getPostById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.PostUpdateInput) {
    return this.postServices.updatePost(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.postServices.deletePost(id);
  }
}
