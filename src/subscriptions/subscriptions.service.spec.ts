import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ChainEventLogService } from "../chain-event-log/chain-event-logs.service";
import { ChainEventLog } from "../chain-event-log/entities/chain-event-log.entity";
import { Subscriptions } from "./entities/subscription.entity";
import { SubscriptionsService } from "./subscriptions.service";

const mockChainEventLogRepository = () => ({});

const mockSubscriptionsRepository = () => ({});

const mockChainEventLogsService = () => ({});

const mockDataSource = () => ({});

describe("SubscriptionsService", () => {
  let service: SubscriptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(ChainEventLog),
          useValue: mockChainEventLogRepository(),
        },
        {
          provide: getRepositoryToken(Subscriptions),
          useValue: mockSubscriptionsRepository(),
        },
        {
          provide: ChainEventLogService,
          useValue: mockChainEventLogsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
