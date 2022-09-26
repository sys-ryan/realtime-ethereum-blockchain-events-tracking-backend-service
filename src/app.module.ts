import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { ChainEventLogService } from "./chain-event-log/chain-event-logs.service";
import { ChainEventLogModule } from "./chain-event-log/chain-event-log.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      validationSchema: Joi.object({
        PORT: Joi.number(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    SubscriptionsModule,
    ChainEventLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
