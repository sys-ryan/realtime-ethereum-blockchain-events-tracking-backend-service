import { Module } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionsController } from "./subscriptions.controller";
import { Subscriptions } from "./entities/subscription.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChainEventLogModule } from "src/chain-event-log/chain-event-log.module";

@Module({
  imports: [TypeOrmModule.forFeature([Subscriptions]), ChainEventLogModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
