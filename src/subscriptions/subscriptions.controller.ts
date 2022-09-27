import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import {
  CreateSubscriptionRequestDto,
  CreateSubscriptionResponseDto,
} from "./dto/create-subscription.dto";
import { GetSubscriptionResponseDto } from "./dto/get-subscription.dto";
import { ListSubscriptionResponseDto } from "./dto/get-subscription-list.dto";
import { DeleteSubscriptionResponseDto } from "./dto/delete-subscription.dto";
import {
  GetSubscriptionLogsQueryDto,
  GetSubscriptionLogsResponseDto,
} from "./dto/get-subscription-logs.dto";

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @HttpCode(201)
  @Post()
  createSubscription(
    @Body() createSubscriptionRequestDto: CreateSubscriptionRequestDto
  ): Promise<CreateSubscriptionResponseDto> {
    return this.subscriptionsService.createSubscription(createSubscriptionRequestDto);
  }

  @Get()
  getSubscriptionList(): Promise<ListSubscriptionResponseDto> {
    return this.subscriptionsService.getSubscriptionList();
  }

  @Get(":subscription_id")
  getSubscription(
    @Param("subscription_id") subscriptionId: number
  ): Promise<GetSubscriptionResponseDto> {
    return this.subscriptionsService.getSubscription(subscriptionId);
  }

  @Delete(":subscription_id")
  removeSubscription(
    @Param("subscription_id", ParseIntPipe) subscriptionId: number
  ): Promise<DeleteSubscriptionResponseDto> {
    return this.subscriptionsService.removeSubscription(subscriptionId);
  }

  @Get(":subscription_id/logs")
  getEventLogs(
    @Param("subscription_id", ParseIntPipe) subscriptionId: number,
    @Query() query: GetSubscriptionLogsQueryDto
  ): Promise<GetSubscriptionLogsResponseDto> {
    return this.subscriptionsService.getEventLogs(subscriptionId, query);
  }
}
