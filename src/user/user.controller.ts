import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { WalletAddress } from 'src/enums/WalletAddress';

@Controller('/user')
export class UserController {
  constructor(private userServices: UserService) {}

  @Get('/:walletAddress')
  async getUserData(@Param('walletAddress') walletAddress: string) {
    const data = await this.userServices.getUserData(walletAddress);
    return { data };
  }
}
