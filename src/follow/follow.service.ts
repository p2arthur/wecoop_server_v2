import { Injectable } from '@nestjs/common';
import axios from 'axios';
import base64 from 'base-64';
import { AssetId } from 'src/enums/AssetId';
import { Fees } from 'src/enums/Fee';
import { NotePrefix } from 'src/enums/NotePrefix';
import { WalletAddress } from 'src/enums/WalletAddress';

@Injectable()
export class FollowService {
  public followTargetList: string[] = [];
  public notePrefix: NotePrefix.WeCoopFollow;

  private setGetFollowTargetsUrl(walletAddress: string) {
    return `https://mainnet-idx.algonode.cloud/v2/accounts/${walletAddress}/transactions?note-prefix=${btoa(
      this.notePrefix,
    )}&tx-type=axfer&asset-id=${AssetId.coopCoin}&currency-greater-than=${
      Fees.FollowWecoopFee - 1
    }&currency-less-than=${Fees.FollowWecoopFee + 1}`;
  }

  //Method to reset postsList propertie of this class
  private resetFollowTargetList() {
    this.followTargetList = [];
  }

  public async getFollowTargetsByAddress(walletAddress: string) {
    this.resetFollowTargetList();

    console.log('wallet address', walletAddress);

    const url = `https://mainnet-idx.algonode.cloud/v2/accounts/DZ6ZKA6STPVTPCTGN2DO5J5NUYEETWOIB7XVPSJ4F3N2QZQTNS3Q7VIXCM/transactions?note-prefix=d2Vjb29wLXYxOmZvbGxvdzo%3D`;

    try {
      const { data } = await axios.get(url);

      const transactions = data.transactions;
      const followTargetsSet = new Set<string>();

      transactions.forEach((transaction) => {
        const decodedNote = atob(transaction.note);
        const target = decodedNote.split(':')[2];
        followTargetsSet.add(target);
      });

      // If you need it as an array
      const followTargetsList = Array.from(followTargetsSet);

      return followTargetsList;
    } catch (error) {
      throw new Error('Error getting follow targets...');
    }
  }
}
