import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { usableAssetsList } from 'src/data/usableAssetList';
import { AssetId } from 'src/enums/AssetId';
import { FollowService } from 'src/follow/follow.service';
import { UserInterface } from 'src/interfaces/UserInterface';
import { UserNfdInterface } from 'src/interfaces/UserNfd';

@Injectable()
export class UserService {
  public userData: UserInterface = {
    address: '',
    avatar: '',
    nfd: { name: '', avatar: '' },
    balance: {},
    followTargets: [],
  };
  //----------------------------------------------------------------------------
  constructor(private followServices: FollowService) {}

  //----------------------------------------------------------------------------
  private resetUserData() {
    this.userData = {
      address: '',
      avatar: '',
      nfd: { name: '', avatar: '' },
      balance: {},
      followTargets: [],
    };
  }

  //----------------------------------------------------------------------------
  private setUserData({
    address,
    avatar,
    nfd,
    balance,
    followTargets,
  }: UserInterface) {
    this.resetUserData();
    const user = { address, avatar, nfd, balance, followTargets };

    this.userData = user;

    return this.userData;
  }

  private async getUserBalance(walletAddres: string) {
    try {
      const userBalances = {};

      Promise.all(
        usableAssetsList.map(async (asset) => {
          const key = asset.assetId;

          const { data } = await axios.get(
            `https://mainnet-idx.algonode.cloud/v2/accounts/${walletAddres}/assets?asset-id=${asset.assetId}&include-all=false`,
          );

          if (!data.assets[0]) {
            userBalances[key] = 0;
            return;
          }

          const balance = parseFloat(
            (data.assets[0].amount / 10 ** 6).toFixed(2),
          );

          userBalances[key] = balance;
        }),
      );

      return userBalances;
    } catch (error) {
      return 0;
    }
  }
  //----------------------------------------------------------------------------

  //----------------------------------------------------------------------------
  public async getUserData(walletAddres: string) {
    const userBalance = await this.getUserBalance(walletAddres);
    const nfd = await this.getUserNfd(walletAddres);
    const followTargets = await this.getUserFollowTargets(walletAddres);

    const userData: UserInterface = {
      address: walletAddres,
      avatar: nfd.avatar || null,
      nfd: nfd,
      balance: userBalance,
      followTargets,
    };

    this.setUserData(userData);

    return this.userData;
  }
  //----------------------------------------------------------------------------

  public async getUserFollowTargets(walletAddres: string) {
    const data =
      await this.followServices.getFollowTargetsByAddress(walletAddres);

    return data;
  }

  //----------------------------------------------------------------------------
  private async getUserNfd(walletAddress: string) {
    let userNfd: UserNfdInterface = { name: null, avatar: null };

    try {
      const { data } = await axios.get(
        `https://api.nf.domains/nfd/lookup?address=${walletAddress}&view=thumbnail&allowUnverified=true`,
      );

      const userNfdData = data?.[walletAddress];
      const nfdName = userNfdData.name;

      const nfdAvatar = userNfdData?.properties?.userDefined?.avatar;

      userNfd = { name: nfdName, avatar: nfdAvatar || null };

      return userNfd;
    } catch (error) {
      console.error('errorss getting user nfd');
      return userNfd;
    }
  }
}
