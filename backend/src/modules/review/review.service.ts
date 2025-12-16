import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Review, ReviewStatus } from './review.entity';
import { ReviewComment, CommentType } from './review-comment.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ReviewComment)
    private commentRepository: Repository<ReviewComment>,
  ) { }

  async createReview(data: {
    projectId: string;
    pullRequestId: string;
    pullRequestNumber: number;
    pullRequestTitle: string;
    pullRequestUrl: string;
    branch: string;
    author: string;
    filesChanged?: any[];
  }) {
    const review = this.reviewRepository.create({
      ...data,
      status: ReviewStatus.PENDING,
    });

    return await this.reviewRepository.save(review);
  }

  async updateReviewStatus(reviewId: string, status: ReviewStatus) {
    await this.reviewRepository.update(reviewId, { status });
  }

  async saveReviewAnalysis(reviewId: string, aiAnalysis: any) {
    await this.reviewRepository.update(reviewId, { aiAnalysis });
  }

  async createComment(data: {
    reviewId: string;
    externalCommentId: string;
    type: CommentType;
    content: string;
    filePath?: string;
    lineNumber?: number;
    author?: string;
    parentCommentId?: string;
    metadata?: any;
  }) {
    const comment = this.commentRepository.create(data);
    return await this.commentRepository.save(comment);
  }

  async findReviewsByProject(projectId: string) {
    return await this.reviewRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findReviewById(reviewId: string) {
    return await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['comments', 'project'],
    });
  }

  async getCommentsByReview(reviewId: string) {
    return await this.commentRepository.find({
      where: { reviewId },
      order: { createdAt: 'ASC' },
    });
  }

  async findCommentByExternalId(externalCommentId: string) {
    return await this.commentRepository.findOne({
      where: { externalCommentId },
    });
  }

  async findCommentByDiscussionId(discussionId: string) {
    return await this.commentRepository.findOne({
      where: {
        externalCommentId: Like(`%${discussionId}%`),
      },
    });
  }
}
