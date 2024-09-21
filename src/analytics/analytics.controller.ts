import { Controller, Get } from '@nestjs/common'; 
import { AnalyticsService } from './analytics.service';

@Controller('/analytics') 
export class AnalyticsController {
  constructor(private analyticsServices: AnalyticsService) {} 

  @Get('/wallets/top-liked-wallets')
  async getTopLikedWallets() {
    const topWallets = await this.analyticsServices.getTop10WalletsWithMostLikes();
    return topWallets; 
  }

  // Rota para obter os posts mais curtidos
  @Get('/posts/top-liked-posts')
  async getTopPostsIds() {
    const topPosts = await this.analyticsServices.getTopLikedPostsIds(); 
    return topPosts;
  }

  // Rota para obter os criadores com mais curtidas
  @Get('/creators/top-liked-creators')
  async getTopLikedCreatorsIds() {
    const topCreators = await this.analyticsServices.getTopLikedCreatorsIds(); 
    return topCreators; 
  }
}
