import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { NotePrefix } from 'src/enums/NotePrefix';
import { PostInterface } from 'src/interfaces/PostInterface';
import { LikesService } from 'src/likes/likes.service';

@Injectable()
export class RepliesService {
  public replies: PostInterface[] = [];

  constructor(private likesService: LikesService) {}

  public filterRepliesByPostTransactionId(
    postTransactionId: string,
    repliesList: any,
    likesList: any,
  ): PostInterface[] {
    const mappedReplies = repliesList.transactions
      .filter((reply) => atob(reply.note).split(':')[3] === postTransactionId)
      .map((filteredReply) => {
        const postText = atob(filteredReply.note).split(':')[4];
        const creatorAddress = filteredReply.sender;
        const transactionId = filteredReply.id;
        const timestamp = filteredReply['round-time'];
        const country = atob(filteredReply.note).split(':')[2];
        const assetId = filteredReply['asset-transfer-transaction']['asset-id'];
        const replyLikes = this.likesService.filterLikesByPostTransactionId(
          transactionId,
          likesList,
        );

        return {
          text: postText,
          creator_address: creatorAddress,
          transaction_id: transactionId,
          timestamp,
          country,
          likes: replyLikes,
          replies: [],
          assetId,
          status: 'accepted',
        };
      });

    this.replies = mappedReplies;
    return this.replies;
  }

  public async getAllReplies() {
    const repliesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopReply,
    )}&tx-type=axfer`;
    const { data } = await axios.get(repliesUrl);

    const allReplies = [];

    const { transactions: replyTransactions } = data;

    replyTransactions.forEach((transaction) => {
      const encodedNote = transaction.note;
      const decodedNote = atob(encodedNote);

      const postId = decodedNote.split(':')[3];
      const sender = transaction.sender;

      allReplies.push({ postId, sender });
    });

    return allReplies;
  }
}
