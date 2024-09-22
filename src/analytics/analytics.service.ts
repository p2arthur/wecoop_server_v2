import { Injectable } from '@nestjs/common';
import axios from 'axios'; 
import { NotePrefix } from 'src/enums/NotePrefix'; 
import { PostService } from 'src/post/post.service';
import { LikesService } from 'src/likes/likes.service';

@Injectable() 
export class AnalyticsService {
  constructor(
    private postServices: PostService,
    private likesServices: LikesService,
  ) {}

  public async getAllLikeTransactions() {
    const likesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopLike,
    )}&tx-type=axfer`;

    try {
      const { data } = await axios.get(likesUrl);

      const { transactions: likeTransactions } = data;


      const allLikes = likeTransactions.map((transaction) => {
        const encodedNote = transaction.note; 
        const decodedNote = atob(encodedNote); 

        const postId = decodedNote.split(':')[3]; 
        const sender = transaction.sender; 

        return { postId, sender }; 
      });

      return allLikes; 
    } catch (error) {
     
      console.error('Erro ao buscar transações de likes:', error);
      return [];
    }
  }

 
  public async getTop10WalletsWithMostLikes() {
    const allLikeTransactions = await this.getAllLikeTransactions();

    const likesPerWallet: { [walletAddress: string]: number } = {}; 

   
    allLikeTransactions.forEach((transaction) => {
      const walletAddress = transaction.sender; 


      if (!likesPerWallet[walletAddress]) {
        likesPerWallet[walletAddress] = 0;
      }


      likesPerWallet[walletAddress]++;
    });


    const sortedTop10Wallets = Object.keys(likesPerWallet)
      .map((walletAddress) => ({
        walletAddress, 
        transactionCount: likesPerWallet[walletAddress], 
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 10); 

    return sortedTop10Wallets; 
  }


  public async getTopLikedPostsIds() {
    const allLikes = await this.likesServices.getAllLikes();
    const perPostLikesCounter: { [postId: string]: number } = {};


    allLikes.forEach((like) => {
      const postId = like.postId;

      if (!perPostLikesCounter[postId]) {
        perPostLikesCounter[postId] = 0;
      }

      perPostLikesCounter[postId]++;
    });


    const sortedTop10LikedPosts = Object.keys(perPostLikesCounter)
      .map((postId) => ({
        postId,
        likesCount: perPostLikesCounter[postId], 
      }))
      .sort((a, b) => b.likesCount - a.likesCount) 
      .slice(0, 10);

    return sortedTop10LikedPosts; 
  }



  async getTopLikedCreatorsIds() {
    const top10LikedPosts = await this.getTopLikedPostsIds(); 
    const top10LikedCreators: { [creatorId: string]: number } = {};


    await Promise.all(
      top10LikedPosts.map(async (likedPost) => {
        const postId = likedPost.postId;
        const likesCount = likedPost.likesCount;


        const creator =
          await this.postServices.getPostCreatorByTransactionId(postId);

        if (creator) {

          if (!top10LikedCreators[creator]) {
            top10LikedCreators[creator] = likesCount;
          } else {
            top10LikedCreators[creator] += likesCount;
          }
        }
      }),
    );


    const sortedTop10LikedCreators = Object.keys(top10LikedCreators)
      .map((creatorAddress) => ({
        creatorAddress,
        likesCount: top10LikedCreators[creatorAddress], 
      }))
      .sort((a, b) => b.likesCount - a.likesCount); 

    return sortedTop10LikedCreators;
  }
}
