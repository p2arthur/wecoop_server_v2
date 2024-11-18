import { Test, TestingModule } from '@nestjs/testing';
import { OrangeMinerService } from './orange_miner.service';

describe('OrangeMinerService', () => {
  let service: OrangeMinerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrangeMinerService],
    }).compile();

    service = module.get<OrangeMinerService>(OrangeMinerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
