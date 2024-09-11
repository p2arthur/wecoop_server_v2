import { Controller, Get } from '@nestjs/common';
import { RepliesService } from './replies.service';

@Controller('replies')
export class RepliesController {
  constructor(private repliesServices: RepliesService) {}

  @Get()
  async getAllReplies() {
    const data = this.repliesServices.getAllReplies();
    return data;
  }
}
