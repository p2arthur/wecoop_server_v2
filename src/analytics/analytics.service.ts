import { Injectable } from '@nestjs/common';
import { PostService } from 'src/post/post.service';
import { LikesService } from 'src/likes/likes.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private postServices: PostService,
    private likesServices: LikesService,
  ) {}

  public async getTopLikedPostsIds() {
    const allLikes = await this.likesServices.getAllLikes();
    const perPostLikesCounter: { [postId: string]: number } = {};

    // Count likes per post
    allLikes.forEach((like) => {
      const postId = like.postId;

      if (!perPostLikesCounter[postId]) {
        perPostLikesCounter[postId] = 0;
      }

      perPostLikesCounter[postId]++;
    });

    // Convert the perPostLikesCounter object to an array of objects for sorting
    const sortedTop10LikedPosts = Object.keys(perPostLikesCounter)
      .map((postId) => ({
        postId,
        likesCount: perPostLikesCounter[postId], // Ensure likesCount is included
      }))
      .sort((a, b) => b.likesCount - a.likesCount) // Sort by likesCount in descending order
      .slice(0, 10); // Return the top 10 posts

    return sortedTop10LikedPosts; // This should now correctly return the postId and likesCount
  }

  async getTopLikedCreatorsIds() {
    const top10LikedPosts = await this.getTopLikedPostsIds(); // Get the top liked posts
    const top10LikedCreators: { [creatorId: string]: number } = {};

    // Process each liked post to accumulate likes per creator
    await Promise.all(
      top10LikedPosts.map(async (likedPost) => {
        const postId = likedPost.postId;
        const likesCount = likedPost.likesCount;

        // Fetch the creator using postId
        const creator =
          await this.postServices.getPostCreatorByTransactionId(postId);

        if (creator) {
          // Accumulate likes per creator
          if (!top10LikedCreators[creator]) {
            top10LikedCreators[creator] = likesCount;
          } else {
            top10LikedCreators[creator] += likesCount;
          }
        }
      }),
    );

    // Convert the top10LikedCreators object to an array of objects for sorting
    const sortedTop10LikedCreators = Object.keys(top10LikedCreators)
      .map((creatorAddress) => ({
        creatorAddress,
        likesCount: top10LikedCreators[creatorAddress], // Include the likesCount for each creator
      }))
      .sort((a, b) => b.likesCount - a.likesCount); // Sort in descending order

    return sortedTop10LikedCreators; // Return sorted creators with likesCount
  }
}
