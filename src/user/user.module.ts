import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FollowService } from 'src/follow/follow.service';

@Module({
  controllers: [UserController],
  providers: [UserService, FollowService],
})
export class UserModule {}
