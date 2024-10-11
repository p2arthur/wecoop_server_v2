import { Body, Controller, Post } from '@nestjs/common';
import { LikesService } from './likes.service';
import { Prisma } from '@prisma/client';

@Controller('likes')
export class LikesController {
  constructor(
    private likesServices: LikesService,
  ) {
  }

  @Post()
  async create(@Body() data: Prisma.LikeCreateInput) {
    return this.likesServices.createLike(data);
  }
}
