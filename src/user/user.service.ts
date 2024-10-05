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

  //----------------------------------------------------------------------------
  private async getUserBalance(walletAddress: string) {
    try {
      const userBalances: { [key: string]: number } = {};

      // Fetch balances for all assets concurrently
      await Promise.all(
        usableAssetsList.map(async (asset) => {
          const key = asset.assetId;

          try {
            const { data } = await axios.get(
              `https://mainnet-idx.algonode.cloud/v2/accounts/${walletAddress}/assets?asset-id=${asset.assetId}&include-all=false`,
            );

            if (data.assets.length === 0 || !data.assets[0]) {
              userBalances[key] = 0;
            } else {
              const balance = parseFloat(
                (data.assets[0].amount / 10 ** 6).toFixed(2),
              );
              userBalances[key] = balance;
            }
          } catch (error) {
            console.error(
              `Error fetching balance for asset ${asset.assetId}:`,
              error,
            );
            userBalances[key] = 0;
          }
        }),
      );

      return userBalances;
    } catch (error) {
      console.error('Error fetching user balances:', error);
      return {};
    }
  }
  //----------------------------------------------------------------------------

  //----------------------------------------------------------------------------
  public async getUserData(walletAddress: string) {
    const userBalance = await this.getUserBalance(walletAddress);
    const nfd = await this.getUserNfd(walletAddress);
    const followTargets = await this.getUserFollowTargets(walletAddress);

    const userData: UserInterface = {
      address: walletAddress,
      avatar: nfd.avatar || null,
      nfd: nfd,
      balance: userBalance,
      followTargets,
    };

    this.setUserData(userData);

    return this.userData;
  }
  //----------------------------------------------------------------------------

  public async getUserFollowTargets(walletAddress: string) {
    const data =
      await this.followServices.getFollowTargetsByAddress(walletAddress);
    return data;
  }

  //----------------------------------------------------------------------------
  private async getUserNfd(walletAddress: string) {
    let userNfd: UserNfdInterface = { name: null, avatar: null };

    try {
      const { data } = await axios.get(
        `https://api.nf.domains/nfd/lookup?address=${walletAddress}&view=thumbnail&allowUnverified=true`,
      );

      const userNfdData = data[walletAddress];
      const nfdName = userNfdData?.name || null;
      const nfdAvatar = userNfdData?.properties?.userDefined?.avatar || null;

      userNfd = { name: nfdName, avatar: nfdAvatar };

      return userNfd;
    } catch (error) {
      console.error('Error fetching NFD data:');
      return userNfd; // Return default NFD if error
    }
  }
}
