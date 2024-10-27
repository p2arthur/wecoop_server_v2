import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/clients/prisma.service';

@Injectable()
export class FilePostService {
  constructor(private prismaService: PrismaService) {}

  async createFilePost(data: Prisma.FilePostCreateInput) {
    console.log('creating file post to db');

    await this.prismaService.filePost.create({ data: data });
    console.log('created file post');
  }
}
