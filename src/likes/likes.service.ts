import { Injectable } from '@nestjs/common';
import axios from 'axios';
import base64 from 'base-64';
import { NotePrefix } from 'src/enums/NotePrefix';

@Injectable()
export class LikesService {
  public likesList: any[];

  public async getAllLikes() {
    const likesUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopLike,
    )}&tx-type=axfer`;

    const { data } = await axios.get(likesUrl);

    const allLikes = [];

    const { transactions: likeTransactions } = data;

    likeTransactions.forEach((transaction) => {
      const encodedNote = transaction.note;
      const decodedNote = atob(encodedNote);

      const postId = decodedNote.split(':')[3];

      allLikes.push({ postId: postId });
    });

    return allLikes;
  }

  public filterLikesByPostTransactionId(
    postTransactionId: string,
    likesList: any,
  ) {
    return likesList.transactions
      .filter((like) => atob(like.note).split(':')[3] == postTransactionId)
      .map((filteredLike) => {
        return { creator_address: filteredLike.sender };
      });
  }
}
