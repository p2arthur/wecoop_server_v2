import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { PrismaService } from 'src/infra/clients/prisma.service';

@Injectable()
export class FilePostService {
  constructor(private prismaService: PrismaService) {}

  async createFilePost(data: Prisma.FilePostCreateInput) {
    await this.prismaService.filePost.create({ data: data });
    console.log('created file post');
  }

  async likeFilePost(data: Prisma.FilePostLikeUncheckedCreateInput) {
    try {
      await this.prismaService.filePostLike.create({ data: data });
    } catch (error) {
      console.error('error ', error);
    }
  }
  async replyFilePost(data: Prisma.FilePostReplyCreateInput) {
    try {
      await this.prismaService.filePostReply.create({ data: data });
    } catch (error) {
      console.error('error ', error);
    }
  }
}
