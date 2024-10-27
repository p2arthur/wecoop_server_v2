import { Controller, Get, Post } from '@nestjs/common';
import { IpfsCrustFactoryService } from './ipfs_crust_factory.service';

@Controller('ipfs-crust-factory')
export class IpfsCrustFactoryController {
  constructor(private ipfsCrustServices: IpfsCrustFactoryService) {}

  @Post('/ipfs_factory')
  async makeIpfs() {
    this.ipfsCrustServices.sendToIpfs();
  }
}
