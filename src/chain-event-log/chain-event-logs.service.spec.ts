import { Test, TestingModule } from "@nestjs/testing";
import { ChainEventLogService } from "./chain-event-logs.service";

describe("ChainEventLogsService", () => {
  let service: ChainEventLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChainEventLogService],
    }).compile();

    service = module.get<ChainEventLogService>(ChainEventLogService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
