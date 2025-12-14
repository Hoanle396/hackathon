import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from './subscription.entity';
import { Team } from '../team/team.entity';

@Injectable()
export class SubscriptionCleanupService {
  private readonly logger = new Logger(SubscriptionCleanupService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  /**
   * Runs daily at 2:00 AM to check for expired subscriptions
   * and downgrade them to FREE plan
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleExpiredSubscriptions() {
    this.logger.log('Starting expired subscription cleanup job...');

    try {
      const now = new Date();

      // Find all subscriptions that are past their period end date
      // and are not already expired or canceled
      const expiredSubscriptions = await this.subscriptionRepository.find({
        where: {
          currentPeriodEnd: LessThan(now),
          status: SubscriptionStatus.ACTIVE,
        },
        relations: ['team'],
      });

      this.logger.log(`Found ${expiredSubscriptions.length} expired subscriptions to process`);

      for (const subscription of expiredSubscriptions) {
        // Skip FREE plans - they never expire
        if (subscription.plan === SubscriptionPlan.FREE) {
          continue;
        }

        this.logger.log(`Processing expired subscription ${subscription.id} for ${subscription.teamId ? 'team' : 'user'} ${subscription.teamId || subscription.userId}`);

        // Mark subscription as EXPIRED
        subscription.status = SubscriptionStatus.EXPIRED;
        
        // Downgrade to FREE plan
        subscription.plan = SubscriptionPlan.FREE;
        subscription.price = 0;
        subscription.maxProjects = 3;
        subscription.maxMembers = 5;
        subscription.monthlyReviewLimit = 100;

        // Reset period for new FREE subscription cycle
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        subscription.currentPeriodStart = now;
        subscription.currentPeriodEnd = periodEnd;
        subscription.currentMonthReviews = 0;

        await this.subscriptionRepository.save(subscription);

        // Update team entity if this is a team subscription
        if (subscription.teamId) {
          let team = subscription.team;
          if (!team) {
            team = await this.subscriptionRepository.manager.findOne(Team, {
              where: { id: subscription.teamId },
            });
          }

          if (team) {
            team.plan = SubscriptionPlan.FREE as any;
            team.maxProjects = 3;
            team.maxMembers = 5;
            team.monthlyReviewLimit = 100;
            await this.subscriptionRepository.manager.save(Team, team);
            
            this.logger.log(`Team ${team.id} downgraded to FREE plan due to expired subscription`);
          }
        }

        this.logger.log(`Subscription ${subscription.id} downgraded to FREE plan`);
      }

      this.logger.log(`Expired subscription cleanup completed. Processed ${expiredSubscriptions.length} subscriptions`);
    } catch (error) {
      this.logger.error('Error during expired subscription cleanup', error);
    }
  }

  /**
   * Runs every hour to check for subscriptions that are past due
   * (expired over 7 days ago) and mark them as past due
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handlePastDueSubscriptions() {
    this.logger.log('Checking for past due subscriptions...');

    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Find subscriptions that expired over 7 days ago and are still marked as EXPIRED
      const pastDueSubscriptions = await this.subscriptionRepository.find({
        where: {
          currentPeriodEnd: LessThan(sevenDaysAgo),
          status: SubscriptionStatus.EXPIRED,
        },
      });

      if (pastDueSubscriptions.length > 0) {
        this.logger.log(`Found ${pastDueSubscriptions.length} past due subscriptions`);

        for (const subscription of pastDueSubscriptions) {
          subscription.status = SubscriptionStatus.PAST_DUE;
          await this.subscriptionRepository.save(subscription);
        }

        this.logger.log(`Marked ${pastDueSubscriptions.length} subscriptions as PAST_DUE`);
      }
    } catch (error) {
      this.logger.error('Error during past due subscription check', error);
    }
  }

  /**
   * Runs on the first day of each month at 1:00 AM
   * to reset monthly review counters
   */
  @Cron('0 1 1 * *')
  async resetMonthlyReviewCounters() {
    this.logger.log('Resetting monthly review counters...');

    try {
      await this.subscriptionRepository
        .createQueryBuilder()
        .update(Subscription)
        .set({ currentMonthReviews: 0 })
        .where('status = :status', { status: SubscriptionStatus.ACTIVE })
        .execute();

      this.logger.log('Monthly review counters reset successfully');
    } catch (error) {
      this.logger.error('Error resetting monthly review counters', error);
    }
  }
}
