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
import { isNumber } from '@nestjs/common/utils/shared.utils';
import { PollsService } from 'src/polls/polls.service';
import { PollInterface } from 'src/interfaces/PollInterface';
import { PrismaService } from 'src/infra/clients/prisma.service';

@Injectable()
export class FeedService {
  private notePrefix: string = NotePrefix.WeCoopPost;
  private postsList: PostInterface[] = [];
  private pollsList: PollInterface[] = [];

  constructor(
    private postServices: PostService,
    private likesServices: LikesService,
    private repliesServices: RepliesService,
    private pollsService: PollsService,
    private prismaService: PrismaService,
  ) {}

  private setGetPostsUrl(address: string, assetId: number): string {
    return `https://mainnet-idx.algonode.cloud/v2/accounts/${address}/transactions?note-prefix=${base64.encode(
      this.notePrefix,
    )}&tx-type=axfer&asset-id=${assetId}`;
  }

  private resetPostsList(): void {
    this.postsList = [];
  }

  // Function to separate the posts, likes, and replies and save them in Prisma
  public async processAndSaveTransactions(): Promise<string> {
    this.resetPostsList();

    const likesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopLike,
    )}&tx-type=axfer`;

    const repliesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopReply,
    )}&tx-type=axfer`;

    const [allLikes, allReplies] = await Promise.all([
      axios.get(likesUrl).then((res) => res.data),
      axios.get(repliesUrl).then((res) => res.data),
    ]);

    // Obter todas as transações relacionadas a posts
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

    // Arrays para armazenar os dados
    const postArray = [];
    const likesArray = [];
    const repliesArray = [];

    // Processar cada transação de post
    for (const transaction of allPostTransactions) {
      const postExists = this.postsList.some(
        (post) => post.transaction_id === transaction.id,
      );

      if (!postExists) {
        // Criar o post
        const post = await this.createPost(transaction, allLikes, allReplies);
        if (post) {
          postArray.push(post);

          post.likes.forEach((like) => {
            likesArray.push(like);
          });

          post.replies.forEach((reply) => {
            repliesArray.push(reply);
          });

        }
      }
    }

    console.log(likesArray, 'likes')
    console.log(repliesArray, 'replies')

    // Verificar e salvar os posts
    await Promise.all(
      postArray.map(async (post) => {
        const postExists = await this.prismaService.post.findUnique({
          where: { transaction_id: post.transaction_id as string },
        });

        if (!postExists) {
          await this.prismaService.post.create({
            data: {
              creator_address: post.creator_address,
              transaction_id: post.transaction_id,
              assetId: post.assetId,
              timestamp: post.timestamp,
              country: post.country,
              text: decodeURIComponent(post.text),
            },
          });
        }
      })
    );

    // Verificar e salvar os likes
    await Promise.all(
      likesArray.map(async (like) => {
        const likeExists = await this.prismaService.like.findUnique({
          where: { transaction_id: like.transactionId },
        });

        if (!likeExists) {
          await this.prismaService.like.create({
            data: {
              creator_address: like.creator_address,
              transaction_id: like.transactionId,
              post_transaction_id: like.postTransactionId,
            },
          });
        }
      })
    );

    // Verificar e salvar os replies
    await Promise.all(
      repliesArray.map(async (reply) => {
        const replyExists = await this.prismaService.reply.findUnique({
          where: { transaction_id: reply.transaction_id },
        });

        if (!replyExists) {
          await this.prismaService.reply.create({
            data: {
              creator_address: reply.creator_address,
              transaction_id: reply.transaction_id,
              post_transaction_id: reply.postTransactionId,
              text: decodeURIComponent(reply.text),
              assetId: reply.assetId,
              timestamp: reply.timestamp,
              country: reply.country,
            },
          });
        }
      })
    );

    return 'Transações processadas e salvas com sucesso!';
  }


  // Refactor to loop over usableAssetsList
  public async getAllPosts(walletAddres?: string): Promise<any[]> {
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



    // Encontrar o post com mais likes
    let topPost = this.postsList.reduce((top, current) => {
      return current.likes.length > (top?.likes.length || 0) ? current : top;
    }, null);

    // Inserir a variável isTopPost: true no post com mais likes
    this.postsList = this.postsList.map((post) => ({
      ...post,
      isTopPost: post.transaction_id === topPost?.transaction_id ? true : false,
    }));

    const allPolls = await this.pollsService.getAllPolls();

    this.pollsList = allPolls.sort((a, b) => b.timestamp - a.timestamp);

    return [...this.postsList, ...this.pollsList].sort(
      (b, a) => a.timestamp - b.timestamp,
    );
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
        isPersonalized: false,
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
