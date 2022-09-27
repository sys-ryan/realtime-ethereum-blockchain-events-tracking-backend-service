import { Module } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionsController } from "./subscriptions.controller";
import { Subscriptions } from "./entities/subscription.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChainEventLogModule } from "src/chain-event-log/chain-event-log.module";
import { ChainEventLog } from "src/chain-event-log/entities/chain-event-log.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Subscriptions, ChainEventLog]), ChainEventLogModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
