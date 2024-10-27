import { Module } from '@nestjs/common';
import { FilePostController } from './file_post.controller';
import { FilePostService } from './file_post.service';

@Module({
  controllers: [FilePostController],
  providers: [FilePostService]
})
export class FilePostModule {}
