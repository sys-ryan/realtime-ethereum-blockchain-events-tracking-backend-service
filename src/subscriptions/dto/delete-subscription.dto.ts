export class DeleteSubscriptionResponseDto {
  id: number;

  topics: string[];

  contractAddress: string;

  createdAt: Date;

  updatedAt: Date;

  /**
   * 구독을 삭제한 일시.
   */
  deletedAt: Date;
}
