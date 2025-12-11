import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TrainingDataType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  CORRECTION = 'correction',
}

@Entity('training_data')
export class TrainingData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column({ type: 'text' })
  codeSnippet: string;

  @Column({ type: 'text' })
  aiComment: string;

  @Column({ type: 'text', nullable: true })
  userFeedback?: string;

  @Column({ type: 'text', nullable: true })
  correctedComment?: string;

  @Column({ type: 'enum', enum: TrainingDataType })
  type: TrainingDataType;

  @Column({ type: 'json', nullable: true })
  context?: Record<string, any>;

  @Column({ default: 0 })
  useCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
