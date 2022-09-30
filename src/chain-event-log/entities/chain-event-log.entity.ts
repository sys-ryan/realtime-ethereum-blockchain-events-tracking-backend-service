import { Subscriptions } from "../../subscriptions/entities/subscription.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ChainEventLog {
  /**
   * Log id
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Log timestamp
   */
  @Column({ default: null, comment: "해당 컬럼은 Log Event의 timestamp를 나타냅니다." })
  timestamp: Date;

  // ethers.js 에서 내려주는 체인 이벤트 로그 정보
  // ref: https://github.com/ethers-io/ethers.js/blob/608864fc3f00390e1260048a157af00378a98e41/packages/abstract-provider/src.ts/index.ts#L90_L104
  @Column({ type: "int" })
  blockNumber: number;

  @Column({ type: "varchar", length: "255" })
  blockHash: string;

  @Column({ type: "int" })
  transactionIndex: number;

  @Column()
  removed: boolean;

  @Column({ type: "varchar", length: "255" })
  address: string;

  @Column({ type: "varchar", length: "255" })
  data: string;

  @Column({ type: "simple-array", array: true })
  topics: string[];

  @Column({ type: "varchar", length: "255" })
  transactionHash: string;

  @Column({ type: "int" })
  logIndex: number;

  @ManyToOne(() => Subscriptions, (subscription) => subscription.chainEventLogs)
  @JoinColumn()
  subscription: Subscriptions;
}
