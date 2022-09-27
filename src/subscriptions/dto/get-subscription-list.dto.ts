import { ApiProperty } from "@nestjs/swagger";
import { BLOCKCHAIN_EVENT_ENUM } from "src/common/enums/event.enum";

export class SubscriptionInfo {
  @ApiProperty({ description: "구독 id" })
  id: number;

  @ApiProperty({ description: "구독한 이벤트의 토픽", enum: BLOCKCHAIN_EVENT_ENUM })
  topics: string[];

  @ApiProperty({ description: "이벤트를 구독한 스마트 컨트랙트의 주소" })
  contractAddress: string;

  @ApiProperty({ description: "구독 생성 일시" })
  createdAt: Date;

  @ApiProperty({ description: "구독 최종 수정 일시" })
  updatedAt: Date;
}

export class ListSubscriptionResponseDto {
  subscriptions: SubscriptionInfo[];
}
