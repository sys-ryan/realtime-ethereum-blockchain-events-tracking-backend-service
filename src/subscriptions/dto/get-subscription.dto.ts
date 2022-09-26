export class GetSubscriptionResponseDto {
  id: number;
  topics: string[];
  contractAddress: string;
  createdAt: Date;
  updatedAt: Date;

  // TODO: 해당 구독의 로그 수 체크
  /**
   * 서버에 저장된 해당 구독의 로그 수
   */
  // logSize: number;

  // TODO: 첫 번째 로그 timestamp 얻기
  /**
   * 첫 번째 로그의 timestamp
   */
  // firstLogTimestamp: Date | null;
}
