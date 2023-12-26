import { Controller, Get, Param } from '@nestjs/common';
import { FeedService } from './feed.service';
import { UserService } from 'src/user/user.service';

@Controller('/feed')
export class FeedController {
  constructor(
    private feedService: FeedService,
    private userServices: UserService,
  ) {}

  @Get('/global')
  async getAllPosts() {
    const response = await this.feedService.getAllPosts();
    return response;
  }

  @Get('/:walletAddress')
  async getAllPostsByAddress(@Param('walletAddress') walletAddress: string) {
    const response = await this.feedService.getAllPostsByAddress(walletAddress);

    return response;
  }
  @Get('/by/:walletAddress')
  async getFeedByWalletAddress(@Param('walletAddress') walletAddress: string) {
    const postsList = await this.feedService.getAllPosts();
    const userData = await this.userServices.getUserData(walletAddress);
    const followTargets = userData.followTargets;
    const feed = await this.feedService.getFeedByWalletAddress(
      followTargets,
      postsList,
    );
    console.log('These are filtered posts', feed);
    return feed;
  }
}
