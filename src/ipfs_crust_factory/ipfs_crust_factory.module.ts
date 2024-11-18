import { Module } from '@nestjs/common';
import { IpfsCrustFactoryController } from './ipfs_crust_factory.controller';
import { IpfsCrustFactoryService } from './ipfs_crust_factory.service';

@Module({
  controllers: [IpfsCrustFactoryController],
  providers: [IpfsCrustFactoryService]
})
export class IpfsCrustFactoryModule {}
