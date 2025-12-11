import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { Project } from '../project/project.entity';
import { ReviewModule } from '../review/review.module';
import { AiModule } from '../ai/ai.module';
import { TrainingModule } from '../training/training.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    ReviewModule,
    AiModule,
    TrainingModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
