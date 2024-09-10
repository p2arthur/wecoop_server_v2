import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('/analytics')
export class AnalyticsController {
  constructor(private analyticsServices: AnalyticsService) {}

  @Get('/posts/top-liked-posts')
  async getTopPostsIds() {
    const allPosts = this.analyticsServices.getTopLikedPostsIds();

    return allPosts;
  }

  @Get('/creators/top-liked-creators')
  async getTopLikedCreatorsIds() {
    const topLikedCreators =
      await this.analyticsServices.getTopLikedCreatorsIds();
    return topLikedCreators;
  }
}
