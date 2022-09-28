import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { ChainEventLogModule } from "./chain-event-log/chain-event-log.module";
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      validationSchema: Joi.object({
        PORT: Joi.number(),
        DB_NAME: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    SubscriptionsModule,
    ChainEventLogModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
// TODO: onApplicationBootstrap()에서 suscription event tracking 시작하기 (서비스 재시작시 event tracking 재시작 필요)
