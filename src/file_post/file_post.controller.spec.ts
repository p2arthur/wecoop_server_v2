import { Test, TestingModule } from '@nestjs/testing';
import { FilePostController } from './file_post.controller';

describe('FilePostController', () => {
  let controller: FilePostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilePostController],
    }).compile();

    controller = module.get<FilePostController>(FilePostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
