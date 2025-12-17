import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team, TeamPlan } from './team.entity';
import { TeamMember, TeamRole, InvitationStatus } from './team-member.entity';
import { User } from '../user/user.entity';
import { CreateTeamDto, UpdateTeamDto, InviteMemberDto } from './dto/team.dto';
import { randomBytes } from 'crypto';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../subscription/subscription.entity';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userId: string, createTeamDto: CreateTeamDto) {
    const team = this.teamRepository.create({
      ...createTeamDto,
      ownerId: userId,
    });

    const savedTeam = await this.teamRepository.save(team);

    // Add owner as team member
    await this.teamMemberRepository.save({
      teamId: savedTeam.id,
      userId,
      role: TeamRole.OWNER,
      status: InvitationStatus.ACCEPTED,
    });

    // Find owner's personal subscription to match the plan
    let ownerSubscription = await this.teamRepository.manager.findOne(Subscription, {
      where: { userId },
    });

    // If owner doesn't have a subscription, create FREE for them first
    if (!ownerSubscription) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      ownerSubscription = this.teamRepository.manager.create(Subscription, {
        userId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        price: 0,
        billingCycle: 'monthly',
        maxProjects: 3,
        maxMembers: 5,
        monthlyReviewLimit: 100,
        currentMonthReviews: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });

      ownerSubscription = await this.teamRepository.manager.save(Subscription, ownerSubscription);
    }

    // Create team subscription matching the owner's plan
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const teamSubscription = this.teamRepository.manager.create(Subscription, {
      teamId: savedTeam.id,
      plan: ownerSubscription.plan,
      status: ownerSubscription.status,
      price: ownerSubscription.price,
      billingCycle: ownerSubscription.billingCycle,
      maxProjects: ownerSubscription.maxProjects,
      maxMembers: ownerSubscription.maxMembers,
      monthlyReviewLimit: ownerSubscription.monthlyReviewLimit,
      currentMonthReviews: 0,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    await this.teamRepository.manager.save(Subscription, teamSubscription);

    // Update team entity with subscription details
    savedTeam.plan = ownerSubscription.plan as any;
    savedTeam.maxProjects = ownerSubscription.maxProjects;
    savedTeam.maxMembers = ownerSubscription.maxMembers;
    savedTeam.monthlyReviewLimit = ownerSubscription.monthlyReviewLimit;
    await this.teamRepository.save(savedTeam);

    return savedTeam;
  }

  async findAllByUser(userId: string) {
    const memberships = await this.teamMemberRepository.find({
      where: { userId, status: InvitationStatus.ACCEPTED },
      relations: ['team', 'team.owner'],
    });

    return memberships.map((m) => ({
      ...m.team,
      role: m.role,
    }));
  }

  async findOne(id: string, userId: string) {
    const membership = await this.teamMemberRepository.findOne({
      where: { teamId: id, userId, status: InvitationStatus.ACCEPTED },
      relations: ['team', 'team.owner', 'team.members', 'team.members.user'],
    });

    if (!membership) {
      throw new NotFoundException('Team not found or access denied');
    }

    return {
      ...membership.team,
      role: membership.role,
    };
  }

  async update(id: string, userId: string, updateTeamDto: UpdateTeamDto) {
    const membership = await this.teamMemberRepository.findOne({
      where: { teamId: id, userId },
      relations: ['team'],
    });

    if (!membership || (membership.role !== TeamRole.OWNER && membership.role !== TeamRole.ADMIN)) {
      throw new ForbiddenException('Only team owners and admins can update team');
    }

    Object.assign(membership.team, updateTeamDto);
    return await this.teamRepository.save(membership.team);
  }

  async remove(id: string, userId: string) {
    const team = await this.teamRepository.findOne({
      where: { id, ownerId: userId },
    });

    if (!team) {
      throw new ForbiddenException('Only team owner can delete team');
    }

    await this.teamRepository.remove(team);
    return { message: 'Team deleted successfully' };
  }

  async inviteMember(teamId: string, userId: string, inviteMemberDto: InviteMemberDto) {
    const membership = await this.teamMemberRepository.findOne({
      where: { teamId, userId },
      relations: ['team'],
    });

    if (!membership || (membership.role !== TeamRole.OWNER && membership.role !== TeamRole.ADMIN)) {
      throw new ForbiddenException('Only team owners and admins can invite members');
    }

    // Check team subscription status
    const subscription = await this.teamRepository.manager.findOne(Subscription, {
      where: { teamId },
    });

    if (subscription && subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        `Your team subscription is ${subscription.status}. Please complete payment to activate your subscription.`
      );
    }

    // Check team member limit
    const memberCount = await this.teamMemberRepository.count({
      where: { teamId, status: InvitationStatus.ACCEPTED },
    });

    if (memberCount >= membership.team.maxMembers) {
      throw new BadRequestException('Team member limit reached. Please upgrade your plan.');
    }

    // Find user by email
    const invitedUser = await this.userRepository.findOne({
      where: { email: inviteMemberDto.email },
    });

    if (!invitedUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingMember = await this.teamMemberRepository.findOne({
      where: { teamId, userId: invitedUser.id },
    });

    if (existingMember) {
      if (existingMember.status === InvitationStatus.ACCEPTED) {
        throw new BadRequestException('User is already a team member');
      }
      if (existingMember.status === InvitationStatus.PENDING) {
        throw new BadRequestException('User already has a pending invitation');
      }
    }

    // Create invitation
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invitation = this.teamMemberRepository.create({
      teamId,
      userId: invitedUser.id,
      role: inviteMemberDto.role || TeamRole.MEMBER,
      status: InvitationStatus.PENDING,
      invitationToken: token,
      invitationExpiresAt: expiresAt,
      invitedByEmail: inviteMemberDto.email,
    });

    await this.teamMemberRepository.save(invitation);

    // TODO: Send invitation email

    return {
      message: 'Invitation sent successfully',
      invitationToken: token,
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.teamMemberRepository.findOne({
      where: {
        invitationToken: token,
        userId,
        status: InvitationStatus.PENDING,
      },
      relations: ['team'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.invitationExpiresAt && invitation.invitationExpiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    invitation.status = InvitationStatus.ACCEPTED;
    invitation.invitationToken = null;
    await this.teamMemberRepository.save(invitation);

    return {
      message: 'Invitation accepted',
      team: invitation.team,
    };
  }

  async declineInvitation(token: string, userId: string) {
    const invitation = await this.teamMemberRepository.findOne({
      where: {
        invitationToken: token,
        userId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = InvitationStatus.DECLINED;
    invitation.invitationToken = null;
    await this.teamMemberRepository.save(invitation);

    return {
      message: 'Invitation declined',
    };
  }

  async removeMember(teamId: string, memberId: string, userId: string) {
    const requesterMembership = await this.teamMemberRepository.findOne({
      where: { teamId, userId },
    });

    if (!requesterMembership || (requesterMembership.role !== TeamRole.OWNER && requesterMembership.role !== TeamRole.ADMIN)) {
      throw new ForbiddenException('Only team owners and admins can remove members');
    }

    const memberToRemove = await this.teamMemberRepository.findOne({
      where: { id: memberId, teamId },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Team member not found');
    }

    if (memberToRemove.role === TeamRole.OWNER) {
      throw new ForbiddenException('Cannot remove team owner');
    }

    await this.teamMemberRepository.remove(memberToRemove);
    return { message: 'Member removed successfully' };
  }

  async updateMemberRole(teamId: string, memberId: string, userId: string, role: TeamRole) {
    const requesterMembership = await this.teamMemberRepository.findOne({
      where: { teamId, userId },
    });

    if (!requesterMembership || requesterMembership.role !== TeamRole.OWNER) {
      throw new ForbiddenException('Only team owner can change member roles');
    }

    const member = await this.teamMemberRepository.findOne({
      where: { id: memberId, teamId },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.role === TeamRole.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }

    member.role = role;
    await this.teamMemberRepository.save(member);

    return { message: 'Member role updated successfully', member };
  }

  async getTeamMembers(teamId: string, userId: string) {
    const membership = await this.teamMemberRepository.findOne({
      where: { teamId, userId, status: InvitationStatus.ACCEPTED },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    return await this.teamMemberRepository.find({
      where: { teamId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async getPendingInvitations(userId: string) {
    return await this.teamMemberRepository.find({
      where: {
        userId,
        status: InvitationStatus.PENDING,
      },
      relations: ['team', 'team.owner'],
    });
  }
}
