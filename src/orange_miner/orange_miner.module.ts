import { Global, Module } from '@nestjs/common';
import { OrangeMinerService } from './orange_miner.service';
@Global()
@Module({
  providers: [OrangeMinerService],
})
export class OrangeMinerModule {}
