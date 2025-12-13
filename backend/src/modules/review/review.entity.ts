import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { ReviewComment } from './review-comment.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pullRequestId: string;

  @Column()
  pullRequestNumber: number;

  @Column()
  pullRequestTitle: string;

  @Column()
  pullRequestUrl: string;

  @Column()
  branch: string;

  @Column()
  author: string;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ type: 'json', nullable: true })
  filesChanged?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;

  @Column({ type: 'json', nullable: true })
  aiAnalysis?: Record<string, any>;

  @ManyToOne(() => Project, (project) => project.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @OneToMany(() => ReviewComment, (comment) => comment.review, { cascade: true, onDelete: 'CASCADE' })
  comments: ReviewComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
