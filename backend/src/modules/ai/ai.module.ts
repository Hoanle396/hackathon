import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { TrainingData } from '../training/training-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingData])],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
