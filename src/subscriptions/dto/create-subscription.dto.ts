import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { BLOCKCHAIN_EVENT_ENUM } from "../../common/enums/event.enum";

export class CreateSubscriptionRequestDto {
  /**
   * 구독할 이벤트의 토픽
   */
  @IsEnum(BLOCKCHAIN_EVENT_ENUM, { each: true })
  // CreateSubscriptionRequestDto.topics type을 string[] 에서 BLOCKCHAIN_EVENT_ENUM[] 으로 변경
  // 존재하지 않는 topic hash 값일 경우 오류 처리를 용이하게 하기 위함.
  // 존재하지 않는 topic hash 값일 경우 결과적으로 아무런 로그 정보도 저장되지 않을 것이며, 이 경우 요청 측에서 이 상황을 파악할 수 있도록 하는 것이 합리적이라고 판단.
  topics: BLOCKCHAIN_EVENT_ENUM[];

  /**
   * 이벤트를 구독할 스마트 컨트랙트의 주소
   */
  @IsString({ message: "Invalid contractAddress." })
  @IsNotEmpty({ message: "contractAddress must not be empty" })
  contractAddress: string;
}

export class CreateSubscriptionResponseDto {
  /**
   * 구독 id (:subscription-id)
   */
  id: number;

  /**
   * 구독한 이벤트의 토픽
   */
  @ApiProperty({ enum: BLOCKCHAIN_EVENT_ENUM, isArray: true })
  topics: string[];

  /**
   * 이벤트를 구독한 스마트 컨트랙트의 주소
   */
  contractAddress: string;

  /**
   * 구독 생성일시. 서버에서는 Date 객체로 다루지만 응답은 string 으로 내려준다
   */
  createdAt: Date;

  /**
   * 구독 최종 수정일시. 서버에서는 Date 객체로 다루지만 응답은 string 으로 내려준다
   */
  updatedAt: Date;
}
