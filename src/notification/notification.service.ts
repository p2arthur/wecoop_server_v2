import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/clients/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  // Criar uma nova notificação
  async createNotification(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({ data });
  }

  // Buscar todas as notificações
  async getAllNotifications() {
    return this.prisma.notification.findMany();
  }

  // Buscar notificações por wallet_address
  async getNotificationsByWalletAddress(walletAddress: string) {
    return this.prisma.notification.findMany({
      where: { wallet_address: walletAddress },
    });
  }

  async getNotificationsByWalletAndPoll(walletAddress: string, pollId: number) {
    return this.prisma.notification.findMany({
      where: { wallet_address: walletAddress, pollId: pollId },
    });
  }

  // Marcar notificações como lidas por wallet_address
  async markAsRead(walletAddress: string) {
    return this.prisma.notification.updateMany({
      where: { wallet_address: walletAddress },
      data: { read: true },
    });
  }

  // Deletar uma notificação
  async deleteNotification(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
