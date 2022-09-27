import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  ParseIntPipe,
} from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import {
  CreateSubscriptionRequestDto,
  CreateSubscriptionResponseDto,
} from "./dto/create-subscription.dto";
import { GetSubscriptionResponseDto } from "./dto/get-subscription.dto";
import { ListSubscriptionResponseDto } from "./dto/get-subscription-list.dto";
import { DeleteSubscriptionResponseDto } from "./dto/delete-subscription.dto";

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
    @Param("subscription_id") subscriptionId: number
  ): Promise<DeleteSubscriptionResponseDto> {
    return this.subscriptionsService.removeSubscription(subscriptionId);
  }

  // @Post()
  // create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
  //   return this.subscriptionsService.create(createSubscriptionDto);
  // }

  // @Get()
  // findAll() {
  //   return this.subscriptionsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.subscriptionsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
  //   return this.subscriptionsService.update(+id, updateSubscriptionDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.subscriptionsService.remove(+id);
  // }
}
