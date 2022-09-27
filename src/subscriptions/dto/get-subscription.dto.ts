export class GetSubscriptionResponseDto {
  id: number;
  topics: string[];
  contractAddress: string;
  createdAt: Date;
  updatedAt: Date;

  /**
   * 서버에 저장된 해당 구독의 로그 수
   */
  logSize: number;

  /**
   * 첫 번째 로그의 timestamp
   */
  firstLogTimestamp: Date | null;
}
