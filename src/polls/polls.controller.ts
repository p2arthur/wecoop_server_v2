import { Controller, Get } from '@nestjs/common';
import { PollsService } from './polls.service';

@Controller('polls')
export class PollsController {
  constructor(private pollsServices: PollsService) {}

  @Get('/all-polls')
  async getAllPolls() {
    const allPolls = await this.pollsServices.getAllPolls();

    return allPolls;
  }
}
