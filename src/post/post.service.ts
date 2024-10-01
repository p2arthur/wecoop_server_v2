import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import base64 from 'base-64';
import { AssetId } from 'src/enums/AssetId';
import { Fees } from 'src/enums/Fee';
import { NotePrefix } from 'src/enums/NotePrefix';
import { PostInterface } from 'src/interfaces/PostInterface';
import { LikesService } from 'src/likes/likes.service';
import { RepliesService } from 'src/replies/replies.service';

@Injectable()
export class PostService {
  constructor(
    private likesServices: LikesService,
    private repliesServices: RepliesService,
  ) {}

  private notePrefix: string = NotePrefix.WeCoopPost;

  public post: PostInterface = {
    text: '',
    creator_address: '',
    transaction_id: null,
    timestamp: null,
    country: null,
    likes: null,
    replies: [],
    status: null,
    assetId: 0,
    type: 'post',
  };

  private setGetPostsUrl(address: string) {
    return `https://mainnet-idx.algonode.cloud/v2/accounts/${address}/transactions?note-prefix=${base64.encode(
      this.notePrefix,
    )}&tx-type=axfer&asset-id=${AssetId.coopCoin}&currency-greater-than=${
      Fees.PostFee - 1
    }&currency-less-than=${Fees.PostFee + 1}`;
  }

  public async setPost(transaction: any) {
    const encodedNote = transaction.note;
    const decodedNote = atob(encodedNote);
    const postData = decodedNote.split(':');
    const postCountry = postData[2];
    const postText = postData[3];
    const creatorAddress = transaction.sender;
    const transactionId = transaction.id;
    const timestamp = transaction['round-time'];
    const assetId = transaction['asset-id'];

    this.post = {
      text: postText,
      creator_address: creatorAddress,
      transaction_id: transactionId,
      timestamp,
      country: postCountry,
      likes: null,
      replies: [],
      status: 'accepted',
      assetId,
      type: 'post',
    };

    const likesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopLike,
    )}&tx-type=axfer`;
    const repliesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopReply,
    )}&tx-type=axfer`;

    const { data: allLikes } = await axios.get(likesUrl);
    const { data: allReplies } = await axios.get(repliesUrl);

    const postLikes = this.likesServices.filterLikesByPostTransactionId(
      transaction.id,
      allLikes,
    );

    const postReplies = this.repliesServices.filterRepliesByPostTransactionId(
      transaction.id,
      allReplies,
      allLikes,
    );

    Object.assign(this.post, {
      likes: postLikes,
      replies: postReplies,
    });

    return this.post;
  }

  public async getPostByTransactionId(transactionId: string) {
    const transactionUrl = `https://mainnet-idx.algonode.cloud/v2/transactions/${transactionId}`;

    //Get likes and comments to appent to the found post
    const likesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopLike,
    )}&tx-type=axfer`;
    const repliesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopReply,
    )}&tx-type=axfer`;

    let postLikes = [];
    let postReplies = [];

    try {
      const { data: allLikes } = await axios.get(likesUrl);
      const { data: allReplies } = await axios.get(repliesUrl);

      postLikes = this.likesServices.filterLikesByPostTransactionId(
        transactionId,
        allLikes,
      );

      postReplies = this.repliesServices.filterRepliesByPostTransactionId(
        transactionId,
        allReplies,
        allLikes,
      );
    } catch (error) {
      throw new Error('Unable to get likes or replies');
    }

    try {
      const { data } = await axios.get(transactionUrl);
      if (!data)
        throw new NotFoundException('Post with transaction id not found');

      const post: PostInterface = await this.setPost(data.transaction);

      Object.assign(post, { likes: postLikes, replies: postReplies });

      return post;
    } catch (error) {
      console.error('Error getting post from transaction id', error);
      throw new Error('Error getting post from transaction id');
    }
  }

  public async getPostCreatorByTransactionId(transactionId: string) {
    const transactionUrl = `https://mainnet-idx.algonode.cloud/v2/transactions/${transactionId}`;
    const { data } = await axios.get(transactionUrl);
    const { transaction } = data;

    return transaction.sender;
  }
}
