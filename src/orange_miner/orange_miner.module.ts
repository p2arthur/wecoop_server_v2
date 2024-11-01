import { Module } from '@nestjs/common';
import { OrangeMinerService } from './orange_miner.service';

@Module({
  providers: [OrangeMinerService]
})
export class OrangeMinerModule {}
