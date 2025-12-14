import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { Project } from './project.entity';
import { TeamMember } from '../team/team-member.entity';
import { Subscription } from '../subscription/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, TeamMember, Subscription])],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
