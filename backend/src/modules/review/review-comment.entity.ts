import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Review } from './review.entity';

export enum CommentType {
  AI_GENERATED = 'ai_generated',
  USER_FEEDBACK = 'user_feedback',
  AI_REPLY = 'ai_reply',
}

@Entity('review_comments')
export class ReviewComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  externalCommentId: string;

  @Column({ type: 'enum', enum: CommentType })
  type: CommentType;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  filePath?: string;

  @Column({ nullable: true })
  lineNumber?: number;

  @Column({ nullable: true })
  author?: string;

  @Column({ nullable: true })
  parentCommentId?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: false })
  isTrainingData: boolean;

  @ManyToOne(() => Review, (review) => review.comments)
  @JoinColumn({ name: 'reviewId' })
  review: Review;

  @Column()
  reviewId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
