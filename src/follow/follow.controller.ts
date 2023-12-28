import { Controller, Get, Param } from '@nestjs/common';
import { FollowService } from './follow.service';

@Controller('/follow')
export class FollowController {
  constructor(private followServices: FollowService) {}

  @Get('/targets/follow/:walletAddress')
  async getUserFollowTargets(@Param('walletAddress') walletAddress: string) {
    const data =
      await this.followServices.getFollowTargetsByAddress(walletAddress);

    return data;
  }
  @Get('/targets/unfollow/:walletAddress')
  async getUserUnfollowTargets(@Param('walletAddress') walletAddress: string) {
    const data = this.followServices.getUnfollowTargetsByAddress(walletAddress);
    return data;
  }
}
