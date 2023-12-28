import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as base64 from 'base-64';
import { WalletAddress } from 'src/enums/WalletAddress';
import { NotePrefix } from 'src/enums/NotePrefix';
import { AssetId } from 'src/enums/AssetId';
import { Fees } from 'src/enums/Fee';
import { PostInterface } from 'src/interfaces/PostInterface';
import { PostService } from 'src/post/post.service';
import { LikesService } from 'src/likes/likes.service';
import { RepliesService } from 'src/replies/replies.service';

@Injectable()
export class FeedService {
  //----------------------------------------------------------------------------
  //Setting the prefix of this Class - Posts
  private notePrefix: string = NotePrefix.WeCoopPost;

  //Setting the postsList when this Class is created and setting it to an empty array of Posts
  private postsList: PostInterface[] = [];
  //----------------------------------------------------------------------------

  constructor(
    private postServices: PostService,
    private likesServices: LikesService,
    private repliesServices: RepliesService,
  ) {}

  //Method to reset set indexer url based on a given address
  private setGetPostsUrl(address: string) {
    return `https://mainnet-idx.algonode.cloud/v2/accounts/${address}/transactions?note-prefix=${base64.encode(
      this.notePrefix,
    )}&tx-type=axfer&asset-id=${AssetId.coopCoin}&currency-greater-than=${
      Fees.PostFee - 1
    }&currency-less-than=${Fees.PostFee + 1}`;
  }

  //Method to reset postsList propertie of this class
  private resetPostsList() {
    this.postsList = [];
  }

  //Method to get all posts sent to the platform
  //----------------------------------------------------------------------------
  public async getAllPosts(walletAddres?: string) {
    this.resetPostsList();
    //TODO - Move likes logic to its own service - This is testing
    const likesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopLike,
    )}&tx-type=axfer`;
    const repliesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopReply,
    )}&tx-type=axfer`;

    const { data: allLikes } = await axios.get(likesUrl);
    const { data: allReplies } = await axios.get(repliesUrl);

    const url = this.setGetPostsUrl(WalletAddress.WeCoopMainAddress);
    const { data } = await axios.get(url);
    const { transactions } = data;

    for (let transaction of transactions) {
      const post: PostInterface = await this.postServices.setPost(transaction);

      const postLikes = this.likesServices.filterLikesByPostTransactionId(
        transaction.id,
        allLikes,
      );

      const postReplies = this.repliesServices.filterRepliesByPostTransactionId(
        transaction.id,
        allReplies,
        allLikes,
      );

      Object.assign(post, {
        likes: postLikes,
        replies: postReplies,
      });

      this.postsList.push(post);
    }

    return this.postsList;
  }
  //----------------------------------------------------------------------------

  //Method to get all posts created by a given address
  //----------------------------------------------------------------------------
  public async getAllPostsByAddress(walletAddress: string) {
    const allPosts = await this.getAllPosts();

    const uniquePostList = [];

    allPosts.forEach((post) => {
      if (post.creator_address === walletAddress) {
        uniquePostList.push(post);
      }
    });
    this.postsList = uniquePostList;
    return this.postsList;
  }

  public async getFeedByWalletAddress(
    userFollowTargets: string[],
    postsList: PostInterface[],
  ) {
    const filteredPosts = postsList.filter((post) =>
      userFollowTargets.includes(post.creator_address),
    );

    return filteredPosts;
  }
}
