import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "sqlite",
        database: `database.db`,
        entities: ["dist/**/*.entity{.ts,.js}"],
        synchronize: false,
        autoLoadEntities: true,
        logging: true,
        timezone: "+00:00",
      }),
    }),
  ],
})
export class DatabaseModule {}
