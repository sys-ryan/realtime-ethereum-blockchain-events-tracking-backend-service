import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, Max, Min } from "class-validator";
import { ChainEventLog } from "src/chain-event-log/entities/chain-event-log.entity";
import { SORT_ENUM } from "src/common/enums/log.enum";

export class GetSubscriptionLogsQueryDto {
  @ApiPropertyOptional({ default: SORT_ENUM.DESC })
  @IsEnum(SORT_ENUM)
  readonly sort: SORT_ENUM = SORT_ENUM.DESC;

  @ApiPropertyOptional()
  @ApiProperty({ default: null, minimum: 1000000000000, maximum: 9999999999999 })
  @IsOptional()
  @IsNumber()
  @Min(1000000000000)
  @Max(9999999999999)
  @Transform(({ value }) => {
    if (!value) {
      return null;
    }
    return +value;
  })
  start: number | null = null;

  @ApiPropertyOptional()
  @ApiProperty({ default: null, minimum: 1000000000000, maximum: 9999999999999 })
  @IsOptional()
  @IsNumber()
  @Min(1000000000000)
  @Max(9999999999999)
  @Transform(({ value }) => {
    if (!value) {
      return null;
    }
    return +value;
  })
  end: number | null = null;

  @ApiPropertyOptional()
  @IsNumber()
  @Transform(({ value }) => +value)
  offset: number = 0;

  @ApiPropertyOptional()
  @IsNumber()
  @Transform(({ value }) => +value)
  limit: number = 50;
}

export class GetSubscriptionLogsResponseDto {
  /**
   * 구독 id (:subscription-id)
   */
  id: number;

  /**
   * 서버에 저장된 해당 구독의 로그 수
   */
  logSize: number;

  /**
   * start, end 조건에 맞는 로그 수.
   */
  logSizeInCondition: number;

  /**
   * request 의 offset 파라미터 값
   */
  offset: number;

  /**
   * request 의 limit 파라미터 값
   */
  limit: number;

  /**
   * request 의 sort 파라미터 값
   */
  @ApiProperty({ enum: SORT_ENUM })
  sort: "asc" | "desc";

  /**
   * request 의 start 파라미터 값. unix timestamp (밀리초. 13 자리)
   */
  @ApiProperty({ default: null, minimum: 1000000000000, maximum: 9999999999999 })
  start: number | null;

  /**
   * request 의 end 파라미터 값. unix timestamp (밀리초. 13 자리)
   */
  @ApiProperty({ default: null, minimum: 1000000000000, maximum: 9999999999999 })
  end: number | null;

  /**
   * 조건에 해당하는 로그들
   */
  logs: ChainEventLog[];
}
