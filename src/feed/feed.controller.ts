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
    return 'fodase';
  }

  // @Get('/global-last-posts')
  // async getLastPosts() {
  //   const response = await this.feedService.getLastPosts();
  //   return response;
  // }

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
    return feed.sort((a, b) => {
      return b.timestamp - a.timestamp;
    });
  }

  @Get('/asset/:assetId')
  async getFeedByAssetId(@Param('assetId') assetId: number) {
    const postsList = this.feedService.getFeedByAssetId(assetId);

    return postsList;
  }

  @Get('/sync-on-chain/mongodb')
  async createNewPost() {
    const result = await this.feedService.processAndSaveTransactions();

    return result;
  }

  @Get('/global/mongodb')
  async getPostsByMongo() {
    const result = await this.feedService.getAllPostsFromMongo(1, 10000);
    return result;
  }
  @Get('/global/polls/mongodb')
  async getPollsByMongo() {
    const result = await this.feedService.getAllPollsFromMongo(1, 620);
    return result;
  }
}
