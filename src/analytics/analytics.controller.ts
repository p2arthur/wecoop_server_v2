import { Controller, Get } from '@nestjs/common'; // Importa os decorators do NestJS
import { AnalyticsService } from './analytics.service'; // Importa o serviço de analytics

@Controller('/analytics') // Define o caminho base para o controller
export class AnalyticsController {
  constructor(private analyticsServices: AnalyticsService) {} // Injeta o serviço de analytics

  // Rota para obter as carteiras com mais transações de likes
  @Get('/wallets/top-liked-wallets')
  async getTopLikedWallets() {
    const topWallets = await this.analyticsServices.getTop10WalletsWithMostLikes(); // Busca as carteiras com mais transações de likes
    return topWallets; // Retorna a lista das top 10 carteiras
  }

  // Rota para obter os posts mais curtidos
  @Get('/posts/top-liked-posts')
  async getTopPostsIds() {
    const topPosts = await this.analyticsServices.getTopLikedPostsIds(); // Busca os posts mais curtidos
    return topPosts; // Retorna a lista dos top 10 posts mais curtidos
  }

  // Rota para obter os criadores com mais curtidas
  @Get('/creators/top-liked-creators')
  async getTopLikedCreatorsIds() {
    const topCreators = await this.analyticsServices.getTopLikedCreatorsIds(); // Busca os criadores mais curtidos
    return topCreators; // Retorna a lista dos top 10 criadores mais curtidos
  }
}
