import { ChainEventLog } from "../../chain-event-log/entities/chain-event-log.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Subscriptions {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text", array: true })
  topics: string[];

  @Column({ type: "varchar", length: "255" })
  contractAddress: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @OneToMany(() => ChainEventLog, (chainEventLog) => chainEventLog.subscription)
  chainEventLogs: ChainEventLog[];
}
