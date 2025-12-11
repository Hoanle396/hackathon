import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingData, TrainingDataType } from './training-data.entity';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(TrainingData)
    private trainingDataRepository: Repository<TrainingData>,
  ) {}

  async processUserFeedback(
    projectId: string,
    userFeedback: string,
    codeSnippet: string,
    aiComment: string,
  ) {
    // Phân loại feedback
    const type = this.classifyFeedback(userFeedback);

    const trainingData = this.trainingDataRepository.create({
      projectId,
      codeSnippet,
      aiComment,
      userFeedback,
      type,
      correctedComment:
        type === TrainingDataType.CORRECTION ? userFeedback : null,
    });

    await this.trainingDataRepository.save(trainingData);
  }

  private classifyFeedback(feedback: string): TrainingDataType {
    const lowerFeedback = feedback.toLowerCase();

    // Positive signals
    if (
      lowerFeedback.includes('đúng') ||
      lowerFeedback.includes('hay') ||
      lowerFeedback.includes('tốt') ||
      lowerFeedback.includes('thanks') ||
      lowerFeedback.includes('cảm ơn')
    ) {
      return TrainingDataType.POSITIVE;
    }

    // Negative signals
    if (
      lowerFeedback.includes('sai') ||
      lowerFeedback.includes('không đúng') ||
      lowerFeedback.includes('không chính xác')
    ) {
      return TrainingDataType.NEGATIVE;
    }

    // Default to correction if user provides alternative
    if (lowerFeedback.length > 50) {
      return TrainingDataType.CORRECTION;
    }

    return TrainingDataType.NEGATIVE;
  }

  async getTrainingStats(projectId: string) {
    const [positive, negative, correction] = await Promise.all([
      this.trainingDataRepository.count({
        where: { projectId, type: TrainingDataType.POSITIVE },
      }),
      this.trainingDataRepository.count({
        where: { projectId, type: TrainingDataType.NEGATIVE },
      }),
      this.trainingDataRepository.count({
        where: { projectId, type: TrainingDataType.CORRECTION },
      }),
    ]);

    return {
      positive,
      negative,
      correction,
      total: positive + negative + correction,
    };
  }
}
