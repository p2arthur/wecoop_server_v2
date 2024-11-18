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

  private setGetPostsUrl(
    address: string,
    assetId: number,
    limit?: number,
  ): string {
    return `https://mainnet-idx.algonode.cloud/v2/accounts/${address}/transactions?note-prefix=${base64.encode(
      this.notePrefix,
    )}&tx-type=axfer&asset-id=${assetId}${
      isNumber(limit) ? `&limit=${limit}` : ''
    }`;
  }

  private resetPostsList(): void {
    this.postsList = [];
  }

  public async getAllPostsFromMongo(
    page: number,
    pageSize: number,
  ): Promise<any> {
    const skip = (page - 1) * pageSize;

    // Buscar dados paginados
    const dataPromise = this.prismaService.post.aggregateRaw({
      pipeline: [
        {
          $lookup: {
            from: 'Reply',
            localField: 'transaction_id',
            foreignField: 'post_transaction_id',
            as: 'replies',
          },
        },
        {
          $lookup: {
            from: 'Like',
            localField: 'transaction_id',
            foreignField: 'post_transaction_id',
            as: 'likes',
          },
        },
        {
          $addFields: {
            type: 'post',
          },
        },
        {
          $unionWith: {
            coll: 'Poll',
            pipeline: [
              {
                $lookup: {
                  from: 'Voter',
                  localField: 'pollId',
                  foreignField: 'pollId',
                  as: 'voters',
                },
              },
              {
                $addFields: {
                  type: 'poll',
                },
              },
            ],
          },
        },
        {
          $unionWith: {
            coll: 'FilePost',
            pipeline: [
              {
                $lookup: {
                  from: 'FilePostLike',
                  localField: 'filepost_id',
                  foreignField: 'filepost_id',
                  as: 'likes',
                },
              },
              {
                $lookup: {
                  from: 'FilePostReply',
                  localField: 'filepost_id',
                  foreignField: 'filepost_id',
                  as: 'replies',
                },
              },
              {
                $addFields: {
                  type: 'filepost',
                },
              },
            ],
          },
        },
        {
          $sort: {
            timestamp: -1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: pageSize,
        },
      ],
    });

    // Obter contagem total
    const countPromise = this.prismaService.post.aggregateRaw({
      pipeline: [
        {
          $addFields: {
            type: 'post',
          },
        },
        {
          $unionWith: {
            coll: 'Poll',
            pipeline: [
              {
                $addFields: {
                  type: 'poll',
                },
              },
            ],
          },
        },
        {
          $count: 'totalCount',
        },
      ],
    });

    const [data, countResult] = await Promise.all([dataPromise, countPromise]);

    // Fazer type assertion para informar ao TypeScript a estrutura dos dados
    const totalCount =
      (countResult[0] as { totalCount: number })?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data,
      totalCount,
      totalPages,
      currentPage: page,
    };
  }
  public async getAllPollsFromMongo(
    page: number,
    pageSize: number,
  ): Promise<any> {
    const skip = (page - 1) * pageSize;

    // Buscar dados paginados de Polls
    const dataPromise = this.prismaService.poll.aggregateRaw({
      pipeline: [
        {
          $lookup: {
            from: 'Voter',
            localField: 'pollId',
            foreignField: 'pollId',
            as: 'voters',
          },
        },
        {
          $addFields: {
            type: 'poll',
          },
        },
        {
          $sort: {
            timestamp: -1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: pageSize,
        },
      ],
    });

    // Obter contagem total de Polls
    const countPromise = this.prismaService.poll.aggregateRaw({
      pipeline: [
        {
          $addFields: {
            type: 'poll',
          },
        },
        {
          $count: 'totalCount',
        },
      ],
    });

    const [data, countResult] = await Promise.all([dataPromise, countPromise]);

    const totalCount =
      (countResult[0] as { totalCount: number })?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data,
      totalCount,
      totalPages,
      currentPage: page,
    };
  }

  private handleText(postText: string): string {
    let decodedText: string;
    try {
      // Verificar se o texto contém um % isolado que pode quebrar o decodeURIComponent
      const safeText = postText.replace(/%(?![0-9A-Fa-f]{2})/g, '%25'); // Substitui % inválido por %25
      // Ensure %0A is replaced with actual newlines (\n)
      decodedText = decodeURIComponent(safeText).replace(/%0A/g, '\n');
    } catch (error) {
      console.error(
        'Error decoding URI component:',
        error,
        'postText',
        postText,
      );
      // If decoding fails, return the original text or handle accordingly
      decodedText = postText;
    }
    return decodedText;
  }

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

    const allPolls = await this.pollsService.getAllPolls();
    const allVoters = await this.pollsService.getAllVotes();

    // Arrays para armazenar os dados
    const postArray = [];
    const likesArray = [];
    const repliesArray = [];
    const pollsArray = allPolls;

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

    // Usar upsert para garantir que não há conflitos de transação ao salvar os posts
    await Promise.all(
      postArray.map(async (post) => {
        await this.prismaService.post.upsert({
          where: { transaction_id: post.transaction_id as string },
          create: {
            creator_address: post.creator_address,
            transaction_id: post.transaction_id,
            assetId: post.assetId,
            timestamp: post.timestamp,
            country: post.country,
            text: this.handleText(post.text),
          },
          update: {}, // Deixe vazio para não atualizar caso o registro já exista
        });
      }),
    );

    // Usar upsert para polls
    await Promise.all(
      pollsArray.map(async (poll) => {
        await this.prismaService.poll.upsert({
          where: { pollId: poll.pollId },
          create: {
            creator_address: poll.creator_address,
            pollId: poll.pollId,
            status: poll.status,
            assetId: poll.assetId,
            timestamp: poll.timestamp,
            country: poll.country,
            text: decodeURIComponent(poll.text),
            depositedAmount: poll.depositedAmount,
            totalVotes: poll.totalVotes,
            yesVotes: poll.yesVotes,
            expiry_timestamp: poll.expiry_timestamp,
          },
          update: {}, // Deixe vazio se não quiser atualizar
        });
      }),
    );

    // Usar upsert para voters
    await Promise.all(
      allVoters.map(async (voter) => {
        await this.prismaService.voter.upsert({
          where: {
            pollId_voterAddress: {
              pollId: voter.pollId,
              voterAddress: voter.voterAddress,
            },
          },
          create: {
            pollId: voter.pollId,
            voterAddress: voter.voterAddress,
            claimed: voter.claimed,
            in_favor: voter.inFavor,
            deposited_amount: 1,
          },
          update: {}, // Deixe vazio para não atualizar
        });
      }),
    );

    // Usar upsert para likes
    await Promise.all(
      likesArray.map(async (like) => {
        await this.prismaService.like.upsert({
          where: { transaction_id: like.transactionId },
          create: {
            creator_address: like.creator_address,
            transaction_id: like.transactionId,
            post_transaction_id: like.postTransactionId,
          },
          update: {}, // Deixe vazio se não quiser atualizar
        });
      }),
    );

    // Usar upsert para replies
    await Promise.all(
      repliesArray.map(async (reply) => {
        await this.prismaService.reply.upsert({
          where: { transaction_id: reply.transaction_id },
          create: {
            creator_address: reply.creator_address,
            transaction_id: reply.transaction_id,
            post_transaction_id: reply.postTransactionId,
            text: this.handleText(reply.text),
            assetId: reply.assetId,
            timestamp: reply.timestamp,
            country: reply.country,
          },
          update: {}, // Deixe vazio se não quiser atualizar
        });
      }),
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

    console.log(allPolls, 'allPols');

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

    console.log('asset id', assetId);

    const postsMadeWithAssetId = await this.prismaService.post.findMany({
      where: { assetId: Number(assetId) },
      select: {
        transaction_id: true,
        creator_address: true,
        text: true,
        timestamp: true,
        country: true,
        assetId: true,
      },
    });

    console.log('posts by asset id', postsMadeWithAssetId);
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
