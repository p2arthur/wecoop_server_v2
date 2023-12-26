import { Injectable } from '@nestjs/common';
import axios from 'axios';
import base64 from 'base-64';
import { AssetId } from 'src/enums/AssetId';
import { Fees } from 'src/enums/Fee';
import { NotePrefix } from 'src/enums/NotePrefix';
import { WalletAddress } from 'src/enums/WalletAddress';

interface FollowTarget {
  followTarget: string;
  timestamp: number;
}
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

    const followsUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/${walletAddress}/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopFollow,
    )}`;

    const unfollowUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/${walletAddress}/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopUnfollow,
    )}`;

    try {
      const { data: followData } = await axios.get(followsUrl);
      const { data: unfollowData } = await axios.get(unfollowUrl);

      let unfollowTargets;

      if (unfollowData) {
        (unfollowTargets = new Set(
          unfollowData.transactions.map((unfollowTransaction) => {
            const decodedNote = atob(unfollowTransaction.note);
            const target = decodedNote.split(':')[2];
            return {
              unfollowTarget: target,
              timestamp: unfollowTransaction['round-time'],
            };
          }),
        )),
          console.log('unfollowTargets', unfollowTargets);
      }

      const followTargetsSet = new Set(
        followData.transactions.map((transaction) => {
          const decodedNote = atob(transaction.note);
          const target = decodedNote.split(':')[2];
          return { followTarget: target, timestamp: transaction['round-time'] };
        }),
      );
      const followTargetsList: FollowTarget[] = Array.from(
        followTargetsSet,
      ) as FollowTarget[];
      const followTargets = [];
      for (let follow of followTargetsList) {
        for (let unfollow of unfollowTargets) {
          if (follow.timestamp > unfollow.timestamp) {
            followTargets.push(follow.followTarget);
            console.log('follow targets', followTargets);
          }
        }
      }

      return Array.from(new Set(followTargets));
    } catch (error) {
      throw new Error('Error getting follow targets...');
    }
  }
}
