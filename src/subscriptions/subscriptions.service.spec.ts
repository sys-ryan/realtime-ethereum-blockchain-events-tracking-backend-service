import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BLOCKCHAIN_EVENT_ENUM } from "../common/enums/event.enum";
import { DataSource } from "typeorm";
import { ChainEventLogService } from "../chain-event-log/chain-event-logs.service";
import { ChainEventLog } from "../chain-event-log/entities/chain-event-log.entity";
import { Subscriptions } from "./entities/subscription.entity";
import { SubscriptionsService } from "./subscriptions.service";
import { ConflictException, NotFoundException } from "@nestjs/common";

const subscriptions: Subscriptions[] = [];

const chainEventLogs: ChainEventLog[] = [];

const mockChainEventLogRepository = () => ({
  delete: jest.fn(),
});

const mockSubscriptionsRepository = () => ({
  find: jest.fn().mockImplementation(async (query) => {
    const where = query.where;

    let existingSubscriptions: Subscriptions[] = [];

    if (where.contractAddress) {
      existingSubscriptions = subscriptions.filter((subscription) => {
        return subscription.contractAddress === where.contractAddress;
      });
    }

    return existingSubscriptions;
  }),
  findOne: jest.fn().mockImplementation(async (query) => {
    const where = query.where;

    let existingSubscription: Subscriptions;

    if (where.id) {
      existingSubscription = subscriptions.find((subscription) => {
        return subscription.id === where.id;
      });
    }

    return existingSubscription;
  }),
  create: jest.fn().mockImplementation((subscriptionDto) => {
    return subscriptionDto;
  }),
  save: jest.fn().mockImplementation(async (subscription) => {
    const newSubscription = {
      id: Math.random(),
      ...subscription,
    };
    subscriptions.push(newSubscription);

    return newSubscription;
  }),
});

const mockChainEventLogsService = () => ({
  startEventTracking: jest.fn(),
});

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
          useValue: mockChainEventLogsService(),
        },
        {
          provide: DataSource,
          useValue: mockDataSource(),
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(async () => {
    subscriptions.splice(0, subscriptions.length);
    chainEventLogs.splice(0, chainEventLogs.length);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  const DAI_CONTRACT_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

  describe("?????? ??????", () => {
    it("contractAddress??? ??????????????? topics??? elements??? ?????? ?????? ????????? ?????? ??????", async () => {
      await service.createSubscription({
        contractAddress: DAI_CONTRACT_ADDRESS,
        topics: [BLOCKCHAIN_EVENT_ENUM.TRANSFER],
      });

      expect(subscriptions).toHaveLength(1);

      await service.createSubscription({
        contractAddress: DAI_CONTRACT_ADDRESS,
        topics: [BLOCKCHAIN_EVENT_ENUM.TRANSFER, BLOCKCHAIN_EVENT_ENUM.APPROVAL],
      });

      expect(subscriptions).toHaveLength(2);
    });

    it("contractAddress??? ????????????, topics??? elements??? ????????? ?????? ConflictException", async () => {
      await service.createSubscription({
        contractAddress: DAI_CONTRACT_ADDRESS,
        topics: [BLOCKCHAIN_EVENT_ENUM.TRANSFER],
      });

      expect(subscriptions).toHaveLength(1);

      await expect(
        service.createSubscription({
          contractAddress: DAI_CONTRACT_ADDRESS,
          topics: [BLOCKCHAIN_EVENT_ENUM.TRANSFER],
        })
      ).rejects.toBeInstanceOf(ConflictException);

      expect(subscriptions).toHaveLength(1);
    });
  });

  describe("?????? ?????? ??????", () => {
    it(" ???????????? ?????? subscription-id ??? ?????? NotFoundException", async () => {
      const subscription = await service.createSubscription({
        contractAddress: DAI_CONTRACT_ADDRESS,
        topics: [BLOCKCHAIN_EVENT_ENUM.APPROVAL],
      });

      expect(subscriptions).toHaveLength(1);

      await expect(service.getSubscription(Math.random())).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  describe("?????? ??????", () => {
    it("???????????? ?????? subscription-id??? ?????? NotFoundException", async () => {
      const subscription = await service.createSubscription({
        contractAddress: DAI_CONTRACT_ADDRESS,
        topics: [BLOCKCHAIN_EVENT_ENUM.APPROVAL],
      });

      expect(subscriptions).toHaveLength(1);

      await expect(service.removeSubscription(Math.random())).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });
});
