import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { TeamMember, InvitationStatus } from '../team/team-member.entity';
import { Subscription, SubscriptionStatus } from '../subscription/subscription.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async create(userId: string, createProjectDto: CreateProjectDto) {
    // Verify user is member of the team
    const membership = await this.teamMemberRepository.findOne({
      where: {
        userId,
        teamId: createProjectDto.teamId,
        status: InvitationStatus.ACCEPTED,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this team');
    }

    // Check subscription project limit
    const subscription = await this.subscriptionRepository.findOne({
      where: { teamId: createProjectDto.teamId },
    });

    if (subscription) {
      // Check if subscription is active before allowing project creation
      if (subscription.status !== SubscriptionStatus.ACTIVE) {
        throw new BadRequestException(
          `Your subscription is ${subscription.status}. Please complete payment to activate your subscription.`
        );
      }

      // Check project limit
      if (subscription.maxProjects !== -1) {
        // Count existing projects for this team
        const projectCount = await this.projectRepository.count({
          where: { teamId: createProjectDto.teamId },
        });

        if (projectCount >= subscription.maxProjects) {
          throw new BadRequestException(
            `Project limit reached (${subscription.maxProjects}). Please upgrade your subscription plan.`
          );
        }
      }
    }

    const project = this.projectRepository.create({
      ...createProjectDto,
      userId,
    });

    return await this.projectRepository.save(project);
  }

  async findAll(userId: string, teamId?: string) {
    if (teamId) {
      // Verify user is member of the team
      const membership = await this.teamMemberRepository.findOne({
        where: {
          userId,
          teamId,
          status: InvitationStatus.ACCEPTED,
        },
      });

      if (!membership) {
        throw new ForbiddenException('You are not a member of this team');
      }

      return await this.projectRepository.find({
        where: { teamId },
        relations: ['team'],
        order: { createdAt: 'DESC' },
      });
    }

    // Get all teams user is member of
    const memberships = await this.teamMemberRepository.find({
      where: { userId, status: InvitationStatus.ACCEPTED },
    });

    const teamIds = memberships.map(m => m.teamId);

    if (teamIds.length === 0) {
      return [];
    }

    return await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.team', 'team')
      .where('project.teamId IN (:...teamIds)', { teamIds })
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, userId: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['team'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user is member of the project's team
    const membership = await this.teamMemberRepository.findOne({
      where: {
        userId,
        teamId: project.teamId,
        status: InvitationStatus.ACCEPTED,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  async update(id: string, userId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.findOne(id, userId);

    Object.assign(project, updateProjectDto);

    return await this.projectRepository.save(project);
  }

  async remove(id: string, userId: string) {
    const project = await this.findOne(id, userId);
    await this.projectRepository.remove(project);
    return { message: 'Project deleted successfully' };
  }

  async findByIdWithUser(projectId: string) {
    return await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['user'],
    });
  }
}
