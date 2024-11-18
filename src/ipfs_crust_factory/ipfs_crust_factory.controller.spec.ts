import { Test, TestingModule } from '@nestjs/testing';
import { IpfsCrustFactoryController } from './ipfs_crust_factory.controller';

describe('IpfsCrustFactoryController', () => {
  let controller: IpfsCrustFactoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IpfsCrustFactoryController],
    }).compile();

    controller = module.get<IpfsCrustFactoryController>(IpfsCrustFactoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
