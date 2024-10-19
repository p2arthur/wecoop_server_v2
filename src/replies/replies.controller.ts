import { Body, Controller, Get, Post } from '@nestjs/common';
import { RepliesService } from './replies.service';
import { Prisma } from '@prisma/client';

@Controller('replies')
export class RepliesController {
  constructor(private repliesServices: RepliesService) {}

  @Post()
  async create(@Body() data: Prisma.ReplyUncheckedCreateInput) {
    return this.repliesServices.createReply(data);
  }

  @Get()
  async getAllReplies() {
    const data = this.repliesServices.getAllReplies();
    return data;
  }
}
