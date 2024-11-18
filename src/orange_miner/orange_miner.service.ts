import { Injectable, OnModuleInit } from '@nestjs/common';
import algosdk, { Account, Algodv2 } from 'algosdk';
import { env } from 'process';

@Injectable()
export class OrangeMinerService {
  constructor() {}
  private algodClient = new algosdk.Algodv2(
    process.env.ALGOD_TOKEN,
    process.env.ALGOD_SERVER,
    process.env.ALGOD_PORT,
  );

  private orangeAppId = process.env.ORANGE_DISTRIBUTOR_MAINNET;

  private minerAppId = process.env.ORANGE_MINER_APP_ID;
  private minerAddress = process.env.ORANGE_MINER_ADDRESS;
  private depositAddress =
    'TGIPEOKUFC5JFTPFMXGSZWOGOFA7THFZXUTRLQEOH3RD3LGI6QEEWJNML4';

  // async onModuleInit() {
  //
  //
  //   await this.checkNodeConnection();

  //
  //   this.getAppData();

  //
  //   await this.getMinerData('mainnet');
  // }

  private getStateValue(state: any[], key: string): any | null {
    // Encode the key to a Uint8Array as Algorand does
    const encodedKey = new TextEncoder().encode(key);

    // Iterate through the state to find the matching key
    for (const kv of state) {
      // Compare Uint8Array keys using Buffer to handle direct array comparison
      if (Buffer.from(kv.key).equals(Buffer.from(encodedKey))) {
        return kv.value;
      }
    }

    // Return null if the key is not found
    return null;
  }

  private getStateNumber(state: any, key: any) {
    return this.getStateValue(state, key)['uint'];
  }

  private getStateAddress(state: any, key: any) {
    const value = this.getStateValue(state, key);
    return algosdk.encodeAddress(Buffer.from(value['bytes']));
  }

  private async checkNodeConnection() {
    const nodeStats = await this.algodClient.status().do();
  }

  private async getAppData() {
    const { params } = await this.algodClient
      .getApplicationByID(Number(this.orangeAppId))
      .do();

    const { globalState } = params;

    const appData = {
      id: Number(this.orangeAppId),
      asset: this.getStateNumber(globalState, 'token'),
      block: this.getStateNumber(globalState, 'block'),
      totalEffort: this.getStateNumber(globalState, 'total_effort'),
      totalTransactions: this.getStateNumber(globalState, 'total_transactions'),
      halving: this.getStateNumber(globalState, 'halving'),
      halvingSupply: this.getStateNumber(globalState, 'halving_supply'),
      minedSupply: this.getStateNumber(globalState, 'mined_supply'),
      minerReward: this.getStateNumber(globalState, 'miner_reward'),
      lastMiner: this.getStateAddress(globalState, 'last_miner'),
      lastMinerEffort: this.getStateNumber(globalState, 'last_miner_effort'),
      currentMiner: this.getStateAddress(globalState, 'current_miner'),
      currentMinerEffort: this.getStateNumber(
        globalState,
        'current_miner_effort',
      ),
      startTimestamp: this.getStateNumber(globalState, 'start_timestamp'),
    };
  }

  private find<T>(array: T[], condition: (item: T) => boolean): T | null {
    return array.find(condition) || null;
  }

  private findMinerState(accountInfo: any, appId: number): any[] | null {
    const localState = accountInfo['apps-local-state'];

    if (localState) {
      const app = this.find(
        localState,
        (app) => app['id'] === this.orangeAppId,
      );
      return app ? app['key-value'] : null;
    }
    return null;
  }

  private async getMinerData(network: string) {
    const minerInfo = await this.algodClient
      .getApplicationBoxByName(
        Number(this.minerAppId),
        Buffer.from(
          'TGIPEOKUFC5JFTPFMXGSZWOGOFA7THFZXUTRLQEOH3RD3LGI6QEEWJNML4',
          'utf-8',
        ),
      )
      .do();

    const depositInfo = await this.algodClient
      .accountInformation(this.depositAddress)
      .do();

    const localState = this.findMinerState(
      depositInfo,
      Number(this.orangeAppId),
    );

    if (!localState) {
      console.error('Deposit address is not opted in.');
      process.exit(1);
    }

    // return {
    //   ownEffort: this.getStateNumber(localState, 'effort'),
    //   availableBalance: minerInfo.amount - minerInfo['min-balance'],
    // };
  }
}
