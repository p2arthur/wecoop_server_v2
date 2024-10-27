import { Test, TestingModule } from '@nestjs/testing';
import { IpfsCrustFactoryService } from './ipfs_crust_factory.service';

describe('IpfsCrustFactoryService', () => {
  let service: IpfsCrustFactoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IpfsCrustFactoryService],
    }).compile();

    service = module.get<IpfsCrustFactoryService>(IpfsCrustFactoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
