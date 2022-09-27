import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { BLOCKCHAIN_EVENT_ENUM } from "src/common/enums/event.enum";
import { ethers } from "ethers";
import { ConfigService } from "@nestjs/config";
import { ChainEventLog } from "./entities/chain-event-log.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscriptions } from "src/subscriptions/entities/subscription.entity";

@Injectable()
export class ChainEventLogService {
  private logger: Logger = new Logger("ChainEventLog");
  private provider;

  constructor(
    @InjectRepository(ChainEventLog) private chainEventLogRepository: Repository<ChainEventLog>,
    @InjectRepository(Subscriptions) private subscriptionsReponsitory: Repository<Subscriptions>,
    private configService: ConfigService
  ) {
    const ethereumEndpoint = this.configService.get<string>("ETHEREUM_ENDPOINT");
    this.provider = ethers.getDefaultProvider(ethereumEndpoint);
  }

  startEventTracking(subscriptionId: number, address: string, topics: BLOCKCHAIN_EVENT_ENUM[]) {
    this.logger.log(`Start tracking address "${address}" for the following topics: [${topics}]`);

    const contract = new ethers.Contract(address, [], this.provider);

    contract.on("*", async (event) => {
      if (topics.includes(event.topics[0])) {
        const now = new Date(); // Log Timestamp
        const currentTime = this.getKST(now);
        await this.createEventLog(subscriptionId, currentTime, event);
        this.logger.log(`New EventLog saved for subscription id-"${subscriptionId}"`);
      }
    });
  }

  async createEventLog(subscriptionId: number, timestamp: Date, logInfo: ChainEventLog) {
    // ChainEventLog와의 relation을 위해 find subscription
    const subscription = await this.subscriptionsReponsitory.findOne({
      where: { id: subscriptionId },
    });

    const log = await this.chainEventLogRepository.create({
      ...logInfo,
      timestamp,
      subscription,
    });

    await this.chainEventLogRepository.save(log);
  }

  private getKST(now: Date) {
    const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
    const krTimeDiff = 9 * 60 * 60 * 1000; //한국 시간은 UTC보다 9시간 빠름 (9시간의 밀리세컨드 표현)
    const kst = new Date(utc + krTimeDiff);
    return kst;
  }
}
