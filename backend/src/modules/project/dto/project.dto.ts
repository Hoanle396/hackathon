import { IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ProjectType } from '../project.entity';

export class CreateProjectDto {
  @IsNotEmpty()
  name: string;

  @IsEnum(ProjectType)
  type: ProjectType;

  @IsNotEmpty()
  repositoryUrl: string;

  @IsOptional()
  businessContext?: string;

  @IsOptional()
  reviewRules?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  autoReview?: boolean;

  @IsOptional()
  discordChannelId?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  businessContext?: string;

  @IsOptional()
  reviewRules?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  autoReview?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  discordChannelId?: string;
}
