import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ChainEventLogService } from "src/chain-event-log/chain-event-logs.service";
import { DataSource, Repository } from "typeorm";
import {
  CreateSubscriptionRequestDto,
  CreateSubscriptionResponseDto,
} from "./dto/create-subscription.dto";
import { ListSubscriptionResponseDto, SubscriptionInfo } from "./dto/get-subscription-list.dto";
import { GetSubscriptionResponseDto } from "./dto/get-subscription.dto";
import { Subscriptions } from "./entities/subscription.entity";

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscriptions) private subscriptionsRepository: Repository<Subscriptions>,
    private chainEventLogsService: ChainEventLogService,
    private dataSource: DataSource
  ) {}

  async createSubscription(
    createSubscriptionRequestDto: CreateSubscriptionRequestDto
  ): Promise<CreateSubscriptionResponseDto> {
    // 구독 중복 체크 (Error: 409 Conflict)
    // contractAddress가 존재하고 && topic이 모두 일치할 때 conflict
    const isConflict = await this.checkSubscriptionConflict(createSubscriptionRequestDto);
    if (isConflict) {
      throw new ConflictException("이미 존재하는 Subscription 입니다.");
    }

    // 구독 정보 DB 저장
    const subscription = await this.subscriptionsRepository.create(createSubscriptionRequestDto);
    const newSubscription = await this.subscriptionsRepository.save(subscription);

    // 등록된 Subscription에 대한 event tracking 시작
    this.chainEventLogsService.startEventTracking(
      newSubscription.id,
      createSubscriptionRequestDto.contractAddress,
      createSubscriptionRequestDto.topics
    );

    // 구독 정보 응답
    return newSubscription;
  }

  async getSubscriptionList(): Promise<ListSubscriptionResponseDto> {
    const subscriptions = await this.subscriptionsRepository.find();

    return { subscriptions };
  }

  async getSubscription(subscriptionId: number): Promise<GetSubscriptionResponseDto> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
      relations: ["chainEventLogs"],
      order: {
        chainEventLogs: { timestamp: "ASC" },
      },
    });

    if (!subscription) {
      throw new NotFoundException("존재하지 않는 subscription-id");
    }

    console.log(subscription);

    const logSize = subscription.chainEventLogs.length;
    const firstLogTimestamp = subscription.chainEventLogs[0].timestamp;

    const { id, topics, contractAddress, createdAt, updatedAt } = subscription;

    return {
      id,
      topics,
      contractAddress,
      createdAt,
      updatedAt,
      logSize,
      firstLogTimestamp,
    };
  }

  /**
   * subscription 중복 여부를 검사합니다.
   * @param createSubscriptionRequestDto
   * @returns true: conflice / false: not conflict
   */
  private async checkSubscriptionConflict(
    createSubscriptionRequestDto: CreateSubscriptionRequestDto
  ): Promise<boolean> {
    const subscriptions = await this.subscriptionsRepository.find({
      where: { contractAddress: createSubscriptionRequestDto.contractAddress },
    });

    const requestedTopics = JSON.stringify(createSubscriptionRequestDto.topics.sort());
    for (let i = 0; i < subscriptions.length; i++) {
      const existingTopics = JSON.stringify(subscriptions[i].topics.sort());

      if (requestedTopics === existingTopics) {
        return true;
      }
    }

    return false;
  }

  // create(createSubscriptionDto: CreateSubscriptionDto) {
  //   return 'This action adds a new subscription';
  // }

  // findAll() {
  //   return `This action returns all subscriptions`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} subscription`;
  // }

  // update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
  //   return `This action updates a #${id} subscription`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} subscription`;
  // }
}
