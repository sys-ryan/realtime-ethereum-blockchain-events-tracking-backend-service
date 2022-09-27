export class SubscriptionInfo {
  id: number;

  topics: string[];

  contractAddress: string;

  createdAt: Date;

  updatedAt: Date;
}

export class ListSubscriptionResponseDto {
  subscriptions: SubscriptionInfo[];
}
