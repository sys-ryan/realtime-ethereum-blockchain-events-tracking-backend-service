import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CreateSubscriptionRequestDto,
  CreateSubscriptionResponseDto,
} from "./dto/create-subscription.dto";
import { GetSubscriptionResponseDto } from "./dto/get-subscription.dto";
import { Subscriptions } from "./entities/subscription.entity";

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscriptions) private subscriptionsRepository: Repository<Subscriptions>
  ) {}

  async createSubscription(
    createSubscriptionRequestDto: CreateSubscriptionRequestDto
  ): Promise<CreateSubscriptionResponseDto> {
    // TODO: 구독 중복 체크 (Error: 409 Conflict)
    // contractAddress가 존재하고 && topic이 모두 일치할 때 충돌

    // 구독 정보 DB 저장
    const subscription = await this.subscriptionsRepository.create(createSubscriptionRequestDto);
    const newSubscription = await this.subscriptionsRepository.save(subscription);

    // 구독 정보 응답
    return newSubscription;
  }

  async getSubscription(subscriptionId: number): Promise<GetSubscriptionResponseDto> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException("존재하지 않는 subscription-id");
    }

    return subscription;
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
