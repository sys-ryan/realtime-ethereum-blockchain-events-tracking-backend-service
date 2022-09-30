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
        database: `${configService.get<string>("DB_NAME")}-${new Date().toISOString()}.db`,
        entities: ["dist/**/*.entity{.ts,.js}"],
        synchronize: configService.get<boolean>("DB_SYNCHRONIZE") || false,
        logging: false,
        timezone: "+00:00",
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
