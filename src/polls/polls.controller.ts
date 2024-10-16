import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollInterface } from 'src/interfaces/PollInterface';
import { Prisma } from '@prisma/client';

@Controller('polls')
export class PollsController {
  constructor(private pollsServices: PollsService) {}

  @Get('/all-polls')
  async getAllPolls() {
    const allPolls = await this.pollsServices.getAllPolls();

    return allPolls;
  }

  @Post('/create')
  async createNewPoll(@Body() poll: PollInterface) {
    try {
      const result = await this.pollsServices.createPoll(poll);
      return { message: 'Poll created successfully', poll: result };
    } catch (error) {
      console.error('Error creating poll:', error);
      return { message: 'Failed to create poll', error: error.message };
    }
  }

  @Post('/vote')
  async voteOnPoll(@Body() voter: Prisma.VoterUncheckedCreateInput) {
    try {
      const result = await this.pollsServices.createVoter(voter);
      return { message: 'Vote cast successfully', vote: result };
    } catch (error) {
      console.error('Error casting vote:', error);
      return { message: 'Failed to cast vote', error: error.message };
    }
  }

  @Get('voter/:voterAddress')
  async getPollsByVoterAddress(@Param('voterAddress') voterAddress: string) {
    return this.pollsServices.getPollsByVoterAddress(voterAddress);
  }

  @Patch(':voterAddress/:pollId/claim')
  async claimVoter(
    @Param('voterAddress') voterAddress: string,
    @Param('pollId') pollId: number,
  ) {
    return this.pollsServices.claimVoter(voterAddress, Number(pollId));
  }
}
