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
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from "@nestjs/swagger";

@ApiTags("Subscriptions API")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiOperation({
    summary: "구독 추가 API",
    description: "Smart Contract Event에 대한 구독을 추가합니다.",
  })
  @ApiCreatedResponse({
    description: "Smart Contract Event에 대한 구독을 추가합니다.",
    type: CreateSubscriptionResponseDto,
  })
  @HttpCode(201)
  @Post()
  createSubscription(
    @Body() createSubscriptionRequestDto: CreateSubscriptionRequestDto
  ): Promise<CreateSubscriptionResponseDto> {
    return this.subscriptionsService.createSubscription(createSubscriptionRequestDto);
  }

  @ApiOperation({ summary: "구독 목록 조회 API", description: "구독 목록을 조회합니다." })
  @ApiOkResponse({ description: "구독 목록을 조회합니다.", type: ListSubscriptionResponseDto })
  @Get()
  getSubscriptionList(): Promise<ListSubscriptionResponseDto> {
    return this.subscriptionsService.getSubscriptionList();
  }

  @ApiOperation({ summary: "구독 정보 조회 API", description: "구독 정보를 조회합니다." })
  @ApiOkResponse({ description: "구독 정보를 조회합니다.", type: GetSubscriptionResponseDto })
  @Get(":subscription_id")
  getSubscription(
    @Param("subscription_id") subscriptionId: number
  ): Promise<GetSubscriptionResponseDto> {
    return this.subscriptionsService.getSubscription(subscriptionId);
  }

  @ApiOperation({ summary: "구독 삭제 API", description: "구독을 삭제합니다." })
  @ApiOkResponse({ description: "구독을 삭제합니다.", type: DeleteSubscriptionResponseDto })
  @Delete(":subscription_id")
  removeSubscription(
    @Param("subscription_id", ParseIntPipe) subscriptionId: number
  ): Promise<DeleteSubscriptionResponseDto> {
    return this.subscriptionsService.removeSubscription(subscriptionId);
  }

  @ApiOperation({
    summary: "구독 이벤트 로그 조회 API",
    description: "구독한 이벤트의 로그 목록을 조회합니다.",
  })
  @ApiOkResponse({
    description: "구독한 이벤트의 로그 목록을 조회합니다.",
    type: GetSubscriptionLogsResponseDto,
  })
  @Get(":subscription_id/logs")
  getEventLogs(
    @Param("subscription_id", ParseIntPipe) subscriptionId: number,
    @Query() query: GetSubscriptionLogsQueryDto
  ): Promise<GetSubscriptionLogsResponseDto> {
    return this.subscriptionsService.getEventLogs(subscriptionId, query);
  }
}
