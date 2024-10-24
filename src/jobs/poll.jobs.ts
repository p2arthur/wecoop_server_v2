import { Injectable, OnModuleInit } from '@nestjs/common';
import algosdk from 'algosdk';
import { PrismaService } from '../infra/clients/prisma.service';
import * as process from 'process';
import * as schedule from 'node-schedule';
import { usableAssetsList } from '../data/usableAssetList';
import { getAssetDecimals } from '../utils/getAssetDecimals';

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
export class PollExpiryJob implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    console.log('Inicializando agendamentos de polls');
    const upcomingPolls = await this.prisma.poll.findMany({
      where: {
        expiry_timestamp: {
          gte: Math.floor(Date.now() / 1000), // Apenas polls futuras
        },
      },
    });

    for (const poll of upcomingPolls) {
      this.schedulePollExpiry(poll);
    }
  }



  public schedulePollExpiry(poll: Poll): void {
    const expiryDate = new Date(poll.expiry_timestamp * 1000); // Converter para milissegundos
    console.log(`Agendando job para a poll ${poll.pollId} para ${expiryDate}`);

    schedule.scheduleJob(expiryDate, async () => {
      console.log(`Processando poll expirada: ${poll.pollId}`);
      await this.handleExpiredPoll(poll);
    });
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
      await this.sendTransaction(voter.voterAddress, prizePerVoter, poll.assetId);
    }
  }

  private async sendTransaction(voterAddress: string, amountPrizePoll: number, assetId: number) {
    try {
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
🌟 Don't Miss Out! Head over to wecoop.xyz and claim your rewards now! 🏃‍♂️💨💸`

      const sender = process.env.WECOOP_NOTIFICATION_WALLET_ADDRESS;
      const receiver = voterAddress;
      const params = await algodClient.getTransactionParams().do();

      const amountSendTransaction = 1000; // Valor minimo

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: sender,
        receiver: receiver,
        amount: amountSendTransaction,
        suggestedParams: params,
        note: new Uint8Array(Buffer.from(note)),
      });

      const secretKeyObject = algosdk.mnemonicToSecretKey(process.env.WECOOP_NOTIFICATIONS_SECRET_KEY);
      const signedTxn = algosdk.signTransaction(txn, secretKeyObject.sk);
      const txId = txn.txID().toString();


      await algodClient.sendRawTransaction(signedTxn.blob).do();
      console.log(`Transação enviada: ${txId}`);

      await algosdk.waitForConfirmation(algodClient, txId, 10);
    } catch (error) {
      console.error('Erro ao enviar transação ---------', voterAddress);
    }
  }

}
