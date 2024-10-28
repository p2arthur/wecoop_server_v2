import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { IpfsCrustFactoryService } from './ipfs_crust_factory.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('ipfs-crust-factory')
export class IpfsCrustFactoryController {
  constructor(private ipfsCrustServices: IpfsCrustFactoryService) {}

  @Post('/ipfs_factory')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file) {
    if (!file) {
      throw new Error('No file uploaded ');
    }

    const { cid, size } = await this.ipfsCrustServices.sendToIpfs(file);
    return { cid, size };
  }
}
