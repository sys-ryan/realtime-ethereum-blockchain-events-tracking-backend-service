import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Subscriptions } from "src/subscriptions/entities/subscription.entity";
import { ChainEventLogService } from "./chain-event-logs.service";
import { ChainEventLog } from "./entities/chain-event-log.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ChainEventLog, Subscriptions]), ConfigModule],
  providers: [ChainEventLogService],
  exports: [ChainEventLogService],
})
export class ChainEventLogModule {}
