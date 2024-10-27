import { Injectable } from '@nestjs/common';
import { doCrustIpfs, uploadToIpfs } from './doCrustIpfs';
import algosdk from 'algosdk';

@Injectable()
export class IpfsCrustFactoryService {
  async sendToIpfs() {
    const algodClient = new algosdk.Algodv2(
      process.env.ALGOD_TOKEN,
      process.env.ALGOD_SERVER,
      process.env.ALGOD_PORT,
    );

    const response = await fetch(
      'https://pbs.twimg.com/profile_images/1833586754563026944/R41iDqhH_400x400.jpg',
    );
    const blob = await response.blob();
    const file = new File([blob], 'foto_minha.png');

    const { size, cid } = await uploadToIpfs(file);

    console.log('cid before finishing uplad', cid, size);

    const upload = doCrustIpfs('mainnet', algodClient, file, cid, size);

    console.log('result', upload);

    return cid;
  }
}
