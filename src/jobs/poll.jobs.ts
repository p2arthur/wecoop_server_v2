import { Injectable, OnModuleInit } from '@nestjs/common';
import algosdk from 'algosdk';
import { PrismaService } from '../infra/clients/prisma.service';
import * as process from 'process';
import * as schedule from 'node-schedule';
import { usableAssetsList } from '../data/usableAssetList';
import { getAssetDecimals } from '../utils/getAssetDecimals';
import { NotificationService } from '../notification/notification.service';
import { Cron } from '@nestjs/schedule';

interface Poll {
  pollId: number,
  id: string,
  creator_address: string,
  text: string,
  timestamp: number,
  country: string,
  assetId: number,
  depositedAmount: number,
  totalVotes: number,
  yesVotes: number,
  expiry_timestamp: number
}


@Injectable()
export class PollExpiryJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  @Cron('0 11 * * *', {timeZone: 'America/Sao_Paulo'}) // Roda todos dia 11 horas da manha
  async handleExpiredPolls() {
    const upcomingPolls = await this.prisma.poll.findMany({
      where: {
        expiry_timestamp: {
          gte: Math.floor(Date.now() / 1000), // Apenas polls futuras
        },
      },
    });

    for (const poll of upcomingPolls) {
      await this.handleExpiredPoll(poll);
    }
  }



  private async handleExpiredPoll(poll: Poll): Promise<void> {
    const voters = await this.prisma.voter.findMany({
      where: {
        pollId: poll.pollId,
        claimed: false,
      },
    });

    if (voters.length === 0) return; // Evitar divisão por zero

    const prizePerVoter = Math.floor(poll.depositedAmount / voters.length);

    for (const voter of voters) {
      await this.sendTransaction(voter.voterAddress, prizePerVoter, poll.assetId, poll.pollId);
    }
  }

  private async sendTransaction(voterAddress: string, amountPrizePoll: number, assetId: number, pollId: number) {
    try {
      const existingNotification = await this.notificationService.getNotificationsByWalletAndPoll(voterAddress, pollId);

      if (existingNotification.length > 0) {
        console.log(`Notificação já existe para o endereço ${voterAddress} na poll ${pollId}.`);
        return;
      }

      const algodClient = new algosdk.Algodv2(
        process.env.ALGOD_TOKEN,
        process.env.ALGOD_SERVER,
        process.env.ALGOD_PORT,
      );
      const assetInfo = usableAssetsList.find((asset) => asset.assetId === assetId);

      const assetDecimals = await getAssetDecimals(algodClient, assetId);

      const formattedAumount = amountPrizePoll / 10 ** assetDecimals;


      const note = `🎉✨ The WeCoop Poll You Voted On Has Expired! ✨🚩\n
💸 It's Time to Claim Your Prize: ${formattedAumount} | ${assetInfo.name} 🏆💰\n
🌟 Don't Miss Out! Head over to wecoop and claim your rewards now! 🏃‍♂️💨💸`

      const sender = process.env.WECOOP_NOTIFICATION_WALLET_ADDRESS;
      const receiver = voterAddress;
      const amountSendTransaction = 1000; // Valor minimo

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: sender,
        receiver: receiver,
        amount: amountSendTransaction,
        suggestedParams: await algodClient.getTransactionParams().do(),
        note: new Uint8Array(Buffer.from(note)),
      });

      const secretKeyObject = algosdk.mnemonicToSecretKey(process.env.WECOOP_NOTIFICATIONS_SECRET_KEY);
      const signedTxn = algosdk.signTransaction(txn, secretKeyObject.sk);
      const txId = txn.txID().toString();


      await algodClient.sendRawTransaction(signedTxn.blob).do();
      console.log(`Transação enviada: ${txId}`);
      await algosdk.waitForConfirmation(algodClient, txId, 10);


      await this.notificationService.createNotification({
        text: note,
        pollId: pollId,
        wallet_address: voterAddress,
        transaction_id: txId,
        read: false,
      })


    } catch (error) {
      console.error('Erro ao enviar transação ---------', error);
    }
  }

}
