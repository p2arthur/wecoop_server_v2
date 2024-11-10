import { Test, TestingModule } from '@nestjs/testing';
import { OrangeMinerController } from './orange_miner.controller';

describe('OrangeMinerController', () => {
  let controller: OrangeMinerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrangeMinerController],
    }).compile();

    controller = module.get<OrangeMinerController>(OrangeMinerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
