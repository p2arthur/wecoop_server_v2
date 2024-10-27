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
      'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjZieHR0d2xnOXBtcHprMjd3c2doMXdtYmdrYmsxaHJpbWdtMG5zZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tHIRLHtNwxpjIFqPdV/giphy.webp',
    );
    const blob = await response.blob();
    const file = new File([blob], 'foto_minha.png');

    const { size, cid } = await uploadToIpfs(file);

    return { cid, size };
  }
}
