import { PrismaService } from '../clients/prisma.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class DataModule {}
