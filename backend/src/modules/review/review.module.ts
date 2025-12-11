import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { Review } from './review.entity';
import { ReviewComment } from './review-comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewComment])],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
