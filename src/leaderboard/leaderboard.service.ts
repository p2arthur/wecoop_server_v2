import { Injectable } from '@nestjs/common';
import { FeedService } from '../feed/feed.service';
import { LikesService } from '../likes/likes.service';
import { RepliesService } from '../replies/replies.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private feedService: FeedService,
    private likesService: LikesService,
    private repliesService: RepliesService,
  ) {}

  public async getTopCreators(): Promise<{ address: string; count: number }[]> {
    const [posts, likesData, repliesData] = await Promise.all([
      this.feedService.getAllPosts(),
      this.likesService.getAllLikes(),
      this.repliesService.getAllReplies(),
    ]);

    const interactionCounts: { [address: string]: number } = {};

    posts.forEach((post) => {
      const address = post.creator_address;
      interactionCounts[address] = (interactionCounts[address] || 0) + 1;
    });

    likesData.forEach((like) => {
      const address = like.sender;
      interactionCounts[address] = (interactionCounts[address] || 0) + 1;
    });

    repliesData.forEach((reply) => {
      const address = reply.sender;
      interactionCounts[address] = (interactionCounts[address] || 0) + 1;
    });

    const sortedCreators = Object.entries(interactionCounts)
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return sortedCreators;
  }
}
