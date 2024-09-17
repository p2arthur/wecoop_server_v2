import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as base64 from 'base-64';
import { WalletAddress } from 'src/enums/WalletAddress';
import { NotePrefix } from 'src/enums/NotePrefix';
import { PostInterface } from 'src/interfaces/PostInterface';
import { PostService } from 'src/post/post.service';
import { LikesService } from 'src/likes/likes.service';
import { RepliesService } from 'src/replies/replies.service';
import { usableAssetsList } from 'src/data/usableAssetList';

@Injectable()
export class FeedService {
  private notePrefix: string = NotePrefix.WeCoopPost;
  private postsList: PostInterface[] = [];

  constructor(
    private postServices: PostService,
    private likesServices: LikesService,
    private repliesServices: RepliesService,
  ) {}

  private setGetPostsUrl(address: string, assetId: number): string {
    return `https://mainnet-idx.algonode.cloud/v2/accounts/${address}/transactions?note-prefix=${base64.encode(
      this.notePrefix,
    )}&tx-type=axfer&asset-id=${assetId}`;
  }

  private resetPostsList(): void {
    this.postsList = [];
  }

  // Refactor to loop over usableAssetsList
  public async getAllPosts(walletAddres?: string): Promise<PostInterface[]> {
    this.resetPostsList();

    const likesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopLike,
    )}&tx-type=axfer`;

    const repliesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopReply,
    )}&tx-type=axfer`;

    // Fetch likes and replies
    const [allLikes, allReplies] = await Promise.all([
      axios.get(likesUrl).then((res) => res.data),
      axios.get(repliesUrl).then((res) => res.data),
    ]);

    // Loop through the usableAssetsList and get transactions for each asset
    const allPostTransactions = (
      await Promise.all(
        usableAssetsList.map(async (usableAsset) => {
          const assetPostsUrl = this.setGetPostsUrl(
            WalletAddress.WeCoopMainAddress,
            usableAsset.assetId,
          );
          const { data } = await axios.get(assetPostsUrl);
          return data.transactions;
        }),
      )
    ).flat();

    // Sort transactions
    const sortedPostTransactions = allPostTransactions.sort(
      (a, b) => b['confirmed-round'] - a['confirmed-round'],
    );

    // Process transactions into posts
    for (const transaction of sortedPostTransactions) {
      // Verifique se já existe um post com o mesmo transaction_id
      const postExists = this.postsList.some(
        (post) => post.transaction_id === transaction.id,
      );

      if (!postExists) {
        const post = await this.createPost(transaction, allLikes, allReplies);
        if (post) this.postsList.push(post);
      }
    }

    return this.postsList;
  }

  private async createPost(
    transaction: any,
    allLikes: any,
    allReplies: any,
  ): Promise<PostInterface | null> {
    try {
      const encodedNote = transaction.note;
      const decodedNote = atob(encodedNote);
      const [_, __, postCountry, postText] = decodedNote.split(':');
      const creatorAddress = transaction.sender;
      const transactionId = transaction.id;
      const timestamp = transaction['round-time'];
      const assetId = transaction['asset-transfer-transaction']['asset-id'];

      const postLikes = this.likesServices.filterLikesByPostTransactionId(
        transaction.id,
        allLikes,
      );

      const postReplies = this.repliesServices.filterRepliesByPostTransactionId(
        transaction.id,
        allReplies,
        allLikes,
      );

      return {
        text: postText,
        creator_address: creatorAddress,
        transaction_id: transactionId,
        timestamp,
        country: postCountry,
        likes: postLikes,
        replies: postReplies,
        status: 'accepted',
        assetId,
      };
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
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

  public async getFeedByAssetId(assetId: number) {
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

    const postsUrl = this.setGetPostsUrl(
      WalletAddress.WeCoopMainAddress,
      assetId,
    );

    const { data: postsData } = await axios.get(postsUrl);
    const { transactions: postsTransactions } = postsData;

    const allPostTransactions = postsTransactions;

    const sortedPostTransactions = allPostTransactions.sort(
      (a, b) => b['confirmed-round'] - a['confirmed-round'],
    );

    let post: any = {};

    for (let transaction of sortedPostTransactions) {
      const encodedNote = transaction.note;

      const decodedNote = atob(encodedNote);
      if (!decodedNote) return;
      const postData = decodedNote.split(':');
      const postCountry = postData[2];
      const postText = postData[3];
      const creatorAddress = transaction.sender;
      const transactionId = transaction.id;
      const timestamp = transaction['round-time'];
      const assetId = transaction['asset-transfer-transaction']['asset-id'];

      post = {
        text: postText,
        creator_address: creatorAddress,
        transaction_id: transactionId,
        timestamp,
        country: postCountry,
        likes: 0,
        replies: [],
        status: 'accepted',
        assetId,
      };

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
}
