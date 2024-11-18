import { Injectable } from '@nestjs/common';
import axios from 'axios';
import base64 from 'base-64';
import { AssetId } from 'src/enums/AssetId';
import { Fees } from 'src/enums/Fee';
import { NotePrefix } from 'src/enums/NotePrefix';
import { WalletAddress } from 'src/enums/WalletAddress';

export interface Target {
  target: string;
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

  private setLatest(transactions: any[]) {
    const targets: Set<{ target: string; timestamp: number }> = new Set(
      transactions.map((transaction) => {
        const decodedNote = atob(transaction.note);
        const target = decodedNote.split(':')[2];
        const timestamp = transaction['confirmed-round'];
        return { target, timestamp };
      }),
    );

    const targetsArray: { target: string; timestamp: number }[] =
      Array.from(targets);

    const uniqueTargets = {};

    targetsArray.forEach((transactionTarget) => {
      const { target, timestamp } = transactionTarget;

      if (
        !(target in uniqueTargets) ||
        timestamp > uniqueTargets[target].timestamp
      ) {
        uniqueTargets[target] = { target, timestamp };
      } else {
        return;
      }
    });

    return Object.values(uniqueTargets);
  }

  //Method to reset postsList propertie of this class
  private resetFollowTargetList() {
    this.followTargetList = [];
  }

  public async getFollowTargetsByAddress(walletAddress: string) {
    this.resetFollowTargetList();

    const followsUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/${walletAddress}/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopFollow,
    )}`;

    try {
      const { data: followData } = await axios.get(followsUrl);

      const followTargets = this.setLatest(followData.transactions) as Target[];
      const unfollowTargets = (await this.getUnfollowTargetsByAddress(
        walletAddress,
      )) as Target[];

      const data: { followTargets: Target[]; unfollowTargets: Target[] } = {
        followTargets,
        unfollowTargets,
      };

      const filteredFollows = data.followTargets.filter((followTarget) => {
        const matchingUnfollowTarget = data.unfollowTargets.find(
          (unfollowTarget) => unfollowTarget.target === followTarget.target,
        );

        return (
          !matchingUnfollowTarget ||
          followTarget.timestamp > matchingUnfollowTarget.timestamp
        );
      });

      const followersArray: Target[] = Object.values(filteredFollows);
      const mappedFollowers = followersArray.map((follow) => follow.target);
      return mappedFollowers;
    } catch (error) {}
  }

  public async getUnfollowTargetsByAddress(walletAddress: string) {
    const unfollowUrl = `https://mainnet-idx.algonode.cloud/v2/accounts/${walletAddress}/transactions?note-prefix=${btoa(
      NotePrefix.WeCoopUnfollow,
    )}`;

    const { data: unfollowData } = await axios.get(unfollowUrl);

    const unfollowTargets = this.setLatest(unfollowData.transactions);

    return unfollowTargets;
  }
}
