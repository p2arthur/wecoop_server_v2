import { Controller, Get } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get('top-creators')
  public async getTopCreators() {
    const topCreators = await this.leaderboardService.getTopCreators();
    console.log(topCreators, 'top')
    return topCreators;
  }
}
