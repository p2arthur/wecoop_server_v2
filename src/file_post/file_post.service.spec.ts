import { Test, TestingModule } from '@nestjs/testing';
import { FilePostService } from './file_post.service';

describe('FilePostService', () => {
  let service: FilePostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilePostService],
    }).compile();

    service = module.get<FilePostService>(FilePostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
