import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { BLOCKCHAIN_EVENT_ENUM } from "src/common/enums/event.enum";

export class CreateSubscriptionRequestDto {
  /**
   * 구독할 이벤트의 토픽
   */
  @IsEnum(BLOCKCHAIN_EVENT_ENUM, { each: true })
  // TODO:  string[] 대신 ENUM 사용한 이유 설명 작성
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
