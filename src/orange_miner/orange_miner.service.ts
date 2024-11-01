import { Injectable, OnModuleInit } from '@nestjs/common';
import algosdk, { Account } from 'algosdk';

@Injectable()
export class OrangeMinerService implements OnModuleInit {
  constructor(private minerSk: Account) {
    minerSk = algosdk.mnemonicToSecretKey(
      process.env.WECOOP_CRUST_FACTORY_SECRET,
    );
  }
  onModuleInit() {
    console.log('Starting orange miner');
  }
}
