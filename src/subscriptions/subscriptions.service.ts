import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ChainEventLogService } from "../chain-event-log/chain-event-logs.service";
import { ChainEventLog } from "../chain-event-log/entities/chain-event-log.entity";
import { Between, DataSource, Repository } from "typeorm";
import {
  CreateSubscriptionRequestDto,
  CreateSubscriptionResponseDto,
} from "./dto/create-subscription.dto";
import { DeleteSubscriptionResponseDto } from "./dto/delete-subscription.dto";
import {
  GetSubscriptionLogsQueryDto,
  GetSubscriptionLogsResponseDto,
} from "./dto/get-subscription-logs.dto";
import { ListSubscriptionResponseDto, SubscriptionInfo } from "./dto/get-subscription-list.dto";
import { GetSubscriptionResponseDto } from "./dto/get-subscription.dto";
import { Subscriptions } from "./entities/subscription.entity";

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscriptions) private subscriptionsRepository: Repository<Subscriptions>,
    @InjectRepository(ChainEventLog) private chainEventLogRepository: Repository<ChainEventLog>,
    private chainEventLogsService: ChainEventLogService,
    private dataSource: DataSource
  ) {}

  /**
   * 구독 추가
   * @param createSubscriptionRequestDto 구독 생성시 필요한 데이터
   * @returns 추가된 구독 정보
   */
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

  /**
   * 구독 목록 조회
   * @returns 구독 목록
   */
  async getSubscriptionList(): Promise<ListSubscriptionResponseDto> {
    const subscriptions = await this.subscriptionsRepository.find();

    this.formatSubscriptions(subscriptions);

    return { subscriptions };
  }

  private formatSubscriptions(subscriptions: Subscriptions[]) {
    for (let i = 0; i < subscriptions.length; i++) {
      subscriptions[i].topics = subscriptions[i].topics.toString().split(",");
    }
  }

  /**
   * 구독 정보 조회
   * @param subscriptionId 조회할 구독 id
   * @returns 구독 정보
   */
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

    const logSize = subscription.chainEventLogs.length;
    const firstLogTimestamp = subscription.chainEventLogs[0]?.timestamp || null;

    const { id, topics, contractAddress, createdAt, updatedAt } = subscription;

    const formattedTopics = topics.toString().split(",");

    return {
      id,
      topics: formattedTopics,
      contractAddress,
      createdAt,
      updatedAt,
      logSize,
      firstLogTimestamp,
    };
  }

  /**
   * 구독 제거
   * @param subscriptionId 제거할 구독 id
   * @returns 제거된 구독 정보
   */
  async removeSubscription(subscriptionId: number): Promise<DeleteSubscriptionResponseDto> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException("존재하지 않는 subscription-id");
    }

    // 삭제할 subscription과 relation을 가진 event log 제거
    await this.chainEventLogRepository.delete({ subscription: { id: subscriptionId } });

    const deletedSubscription = await this.subscriptionsRepository.remove(subscription);
    const deletedAt = new Date();

    return {
      ...deletedSubscription,
      deletedAt,
    };
  }

  /**
   * 구독에서 발생한 로그 조회
   * @param subscriptionId 로그를 조회할 구독 id
   * @param query 로그 조회시 데이터 필터링 정책
   * @returns 구독에서 발생한 로그 목록
   */
  async getEventLogs(
    subscriptionId: number,
    query: GetSubscriptionLogsQueryDto
  ): Promise<GetSubscriptionLogsResponseDto> {
    const { sort, start, end, offset, limit } = query;

    // 조회할 로그의 timestamp 조건을 Date object로 변환 (TypeORM 의 Between() 의 파라미터 요구사항)
    let startTimestamp;
    let endTimestamp;
    if (!start) {
      startTimestamp = new Date(1000000000000);
    } else {
      startTimestamp = new Date(start);
    }

    if (!end) {
      endTimestamp = new Date(9999999999999);
    } else {
      endTimestamp = new Date(end);
    }

    // 존재하지 않는 subscription-id 인 경우 (404 Not Found)
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      throw new NotFoundException("존재하지 않는 subscription-id");
    }

    // EventLog DB query
    const logs = await this.chainEventLogRepository.find({
      where: {
        subscription: { id: subscriptionId },
        timestamp: Between(startTimestamp, endTimestamp),
      },
      skip: offset,
      take: limit,
      order: {
        timestamp: sort,
      },
    });

    // 추가 필드 생성 (logSize, logSizeInCondition, offset, limit, sort, start, end)
    const logSize = (
      await this.dataSource
        .getRepository(ChainEventLog)
        .createQueryBuilder("event")
        .select("COUNT(event.id)", "logSize")
        .where("event.subscriptionId = :subscriptionId", { subscriptionId })
        .execute()
    )[0].logSize;

    const logSizeInCondition = logs.length;

    const response = {
      id: subscriptionId,
      logSize,
      logSizeInCondition,
      offset,
      limit,
      sort,
      start,
      end,
      logs,
    };

    return response;
  }

  /**
   * subscription 중복 여부를 검사합니다.
   * 이미 db에 contractAddress가 존재하고 && topics의 elements가 일치할 경우 conflict로 판단
   * 이미 db에 contractAddress가 존재하지, topics의 elements 구성이 다를 경우 conflict 가 아니라고 판단. (-> 새로운 구독 생성)
   * @param createSubscriptionRequestDto 구독 생성을 위한 정보
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
}
