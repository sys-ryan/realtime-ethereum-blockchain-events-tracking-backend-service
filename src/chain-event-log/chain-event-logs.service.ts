import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { BLOCKCHAIN_EVENT_ENUM } from "../common/enums/event.enum";
import { ethers } from "ethers";
import { ConfigService } from "@nestjs/config";
import { ChainEventLog } from "./entities/chain-event-log.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscriptions } from "../subscriptions/entities/subscription.entity";

@Injectable()
export class ChainEventLogService {
  private logger: Logger = new Logger("ChainEventLog");
  private provider;

  constructor(
    @InjectRepository(ChainEventLog) private chainEventLogRepository: Repository<ChainEventLog>,
    @InjectRepository(Subscriptions) private subscriptionsRepository: Repository<Subscriptions>,
    private configService: ConfigService
  ) {
    const ethereumEndpoint = this.configService.get<string>("ETHEREUM_ENDPOINT");
    this.provider = ethers.getDefaultProvider(ethereumEndpoint); // ethereumEndpoint: wss://...
  }

  /**
   * address 에 해당하는 Contract의 Smart Contract Event 추적을 시작합니다.
   * @param subscriptionId 구독 추가시 생성된 구독 id
   * @param address 추적하고자 하는 Contract의 address
   * @param topics 필터링할 event hex value
   */
  startEventTracking(subscriptionId: number, address: string, topics: BLOCKCHAIN_EVENT_ENUM[]) {
    this.logger.log(`Start tracking address "${address}" for the following topics: [${topics}]`);

    const contract = new ethers.Contract(address, [], this.provider);

    contract.on("*", async (event) => {
      if (topics.includes(event.topics[0])) {
        const currentTime = new Date(); // Log Timestamp

        await this.createEventLog(subscriptionId, currentTime, event);
        this.logger.log(`New EventLog saved for subscription id-"${subscriptionId}"`);
      }
    });
  }

  /**
   * chain event log를 db에 저장합니다.
   * @param subscriptionId 구독 id
   * @param timestamp 로그의 timestmap
   * @param logInfo 로그 내용
   */
  async createEventLog(subscriptionId: number, timestamp: Date, logInfo: ChainEventLog) {
    // ChainEventLog와의 relation을 위해 find subscription
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
    });

    const log = await this.chainEventLogRepository.create({
      ...logInfo,
      timestamp,
      subscription,
    });

    await this.chainEventLogRepository.save(log);
  }
}
