import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingService } from './training.service';
import { TrainingData } from './training-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingData])],
  providers: [TrainingService],
  exports: [TrainingService],
})
export class TrainingModule {}
