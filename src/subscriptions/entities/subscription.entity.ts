import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Subscriptions {
  // TODO: Column 정보 detail 작성
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "simple-array" })
  topics: string[];

  @Column()
  contractAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
