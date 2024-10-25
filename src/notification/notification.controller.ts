import { Controller, Get, Post, Delete, Body, Param, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Prisma } from '@prisma/client';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async createNotification(@Body() data: Prisma.NotificationCreateInput) {
    return this.notificationService.createNotification(data);
  }

  @Get()
  async getAllNotifications() {
    return this.notificationService.getAllNotifications();
  }

  @Get(':walletAddress')
  async getNotificationsByWalletAddress(@Param('walletAddress') walletAddress: string) {
    return this.notificationService.getNotificationsByWalletAddress(walletAddress);
  }

  @Patch('mark-read/:id')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('mark-read/:walletAddress/:pollId')
  async markAsReadByPoll(@Param('walletAddress') walletAddress: string, @Param('pollId') pollId: number) {
    return this.notificationService.markAsReadByPoll(walletAddress, pollId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    return this.notificationService.deleteNotification(id);
  }
}
