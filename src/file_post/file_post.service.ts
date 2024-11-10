import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import algosdk from 'algosdk';
import { PrismaService } from 'src/infra/clients/prisma.service';

@Injectable()
export class FilePostService {
  constructor(private prismaService: PrismaService) {}

  private filePostAppId = process.env.WECOOP_FILEPOST_APP_ID;

  private algodClient = new algosdk.Algodv2(
    process.env.ALGOD_TOKEN,
    process.env.ALGOD_SERVER,
    process.env.ALGOD_PORT,
  );

  async createFilePost(data: Prisma.FilePostCreateInput) {
    console.log('creating file post to db');

    await this.prismaService.filePost.create({ data: data });
    console.log('created file post');
  }
}
