import { Injectable } from '@nestjs/common';
import { doCrustIpfs, uploadToIpfs } from './doCrustIpfs';
import algosdk from 'algosdk';

@Injectable()
export class IpfsCrustFactoryService {
  async sendToIpfs(uploadFile: File) {
    const algodClient = new algosdk.Algodv2(
      process.env.ALGOD_TOKEN,
      process.env.ALGOD_SERVER,
      process.env.ALGOD_PORT,
    );

    const { size, cid } = await uploadToIpfs(uploadFile);

    return { cid, size };
  }
}
