import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from './subscription.entity';
import { Payment, PaymentStatus } from './payment.entity';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { Web3PaymentService } from './web3-payment.service';

const PLAN_PRICING = {
  [SubscriptionPlan.FREE]: {
    price: 0,
    maxProjects: 3,
    maxMembers: 5,
    monthlyReviewLimit: 100,
  },
  [SubscriptionPlan.STARTER]: {
    price: 29,
    maxProjects: 10,
    maxMembers: 10,
    monthlyReviewLimit: 1000,
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    price: 99,
    maxProjects: 50,
    maxMembers: 25,
    monthlyReviewLimit: 5000,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    price: 299,
    maxProjects: -1, // unlimited
    maxMembers: -1, // unlimited
    monthlyReviewLimit: -1, // unlimited
  },
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private web3PaymentService: Web3PaymentService,
  ) {}

  async create(userId: string, createSubscriptionDto: CreateSubscriptionDto) {
    // Check if user already has a subscription
    const existing = await this.subscriptionRepository.findOne({
      where: createSubscriptionDto.teamId
        ? { teamId: createSubscriptionDto.teamId }
        : { userId },
    });

    // If subscription exists, update it instead
    if (existing) {
      return await this.update(existing.id, createSubscriptionDto);
    }

    const planDetails = PLAN_PRICING[createSubscriptionDto.plan];
    
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = this.subscriptionRepository.create({
      ...createSubscriptionDto,
      userId: createSubscriptionDto.teamId ? null : userId,
      price: planDetails.price,
      maxProjects: planDetails.maxProjects,
      maxMembers: planDetails.maxMembers,
      monthlyReviewLimit: planDetails.monthlyReviewLimit,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      status: createSubscriptionDto.plan === SubscriptionPlan.FREE 
        ? SubscriptionStatus.ACTIVE 
        : SubscriptionStatus.TRIALING,
    });

    return await this.subscriptionRepository.save(subscription);
  }

  async findByUser(userId: string) {
    let subscription = await this.subscriptionRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    // Auto-create FREE subscription for new users
    if (!subscription) {
      const planDetails = PLAN_PRICING[SubscriptionPlan.FREE];
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      subscription = this.subscriptionRepository.create({
        userId,
        plan: SubscriptionPlan.FREE,
        price: planDetails.price,
        maxProjects: planDetails.maxProjects,
        maxMembers: planDetails.maxMembers,
        monthlyReviewLimit: planDetails.monthlyReviewLimit,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: 'monthly',
      });

      subscription = await this.subscriptionRepository.save(subscription);
    }

    return subscription;
  }

  async findByTeam(teamId: string) {
    return await this.subscriptionRepository.findOne({
      where: { teamId },
      relations: ['team'],
    });
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (updateSubscriptionDto.plan) {
      const planDetails = PLAN_PRICING[updateSubscriptionDto.plan];
      subscription.plan = updateSubscriptionDto.plan;
      subscription.price = planDetails.price;
      subscription.maxProjects = planDetails.maxProjects;
      subscription.maxMembers = planDetails.maxMembers;
      subscription.monthlyReviewLimit = planDetails.monthlyReviewLimit;
      
      // Auto-activate for paid plans (demo mode - remove payment requirement)
      if (updateSubscriptionDto.plan !== SubscriptionPlan.FREE) {
        subscription.status = SubscriptionStatus.ACTIVE;
        
        // Update period dates
        const now = new Date();
        subscription.currentPeriodStart = now;
        
        const periodEnd = new Date(now);
        if (subscription.billingCycle === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        subscription.currentPeriodEnd = periodEnd;
      }
    }

    if (updateSubscriptionDto.billingCycle) {
      subscription.billingCycle = updateSubscriptionDto.billingCycle;
    }

    return await this.subscriptionRepository.save(subscription);
  }

  async cancel(id: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = SubscriptionStatus.CANCELED;
    await this.subscriptionRepository.save(subscription);

    return { message: 'Subscription canceled successfully' };
  }

  async incrementUsage(subscriptionId: string, count: number = 1) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.currentMonthReviews += count;
    await this.subscriptionRepository.save(subscription);

    return subscription;
  }

  async checkUsageLimit(subscriptionId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return false;
    }

    // Unlimited for enterprise
    if (subscription.monthlyReviewLimit === -1) {
      return true;
    }

    return subscription.currentMonthReviews < subscription.monthlyReviewLimit;
  }

  async getUsage(subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const usagePercentage = subscription.monthlyReviewLimit === -1
      ? 0
      : (subscription.currentMonthReviews / subscription.monthlyReviewLimit) * 100;

    const remainingReviews = subscription.monthlyReviewLimit === -1
      ? -1
      : subscription.monthlyReviewLimit - subscription.currentMonthReviews;

    return {
      currentMonthReviews: subscription.currentMonthReviews,
      monthlyReviewLimit: subscription.monthlyReviewLimit,
      usagePercentage: Math.round(usagePercentage),
      remainingReviews,
    };
  }

  async resetMonthlyUsage(subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.currentMonthReviews = 0;
    
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = periodEnd;

    await this.subscriptionRepository.save(subscription);

    return { message: 'Monthly usage reset successfully' };
  }

  async createPayment(
    subscriptionId: string,
    amount: number,
    walletAddress: string,
    metadata?: Record<string, any>,
  ) {
    // Validate wallet address
    if (!this.web3PaymentService.isValidAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    const payment = this.paymentRepository.create({
      subscriptionId,
      amount,
      currency: 'USDC',
      status: PaymentStatus.PENDING,
      fromAddress: walletAddress,
      toAddress: this.web3PaymentService.getReceiverAddress(),
      metadata,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    return {
      payment: savedPayment,
      receiverAddress: this.web3PaymentService.getReceiverAddress(),
      supportedChains: this.web3PaymentService.getSupportedChains(),
      amount: amount,
    };
  }

  async verifyAndConfirmPayment(
    paymentId: string,
    transactionHash: string,
    chainId: number,
  ) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['subscription'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Payment already confirmed');
    }

    try {
      // Verify the blockchain transaction
      const verification = await this.web3PaymentService.verifyPayment(
        transactionHash,
        payment.amount,
        chainId,
      );

      if (!verification.isValid) {
        payment.status = PaymentStatus.FAILED;
        await this.paymentRepository.save(payment);
        throw new BadRequestException('Payment verification failed');
      }

      // Update payment with blockchain details
      payment.status = PaymentStatus.SUCCEEDED;
      payment.transactionHash = verification.transactionHash;
      payment.fromAddress = verification.from;
      payment.toAddress = verification.to;
      payment.chainId = verification.chainId;
      payment.blockNumber = verification.blockNumber;
      payment.metadata = {
        ...payment.metadata,
        verifiedAt: new Date().toISOString(),
        blockTimestamp: verification.timestamp,
      };

      await this.paymentRepository.save(payment);

      // Activate subscription
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: payment.subscriptionId },
      });

      if (subscription) {
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.walletAddress = verification.from;
        
        // Update period dates
        const now = new Date();
        subscription.currentPeriodStart = now;
        
        const periodEnd = new Date(now);
        if (subscription.billingCycle === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        subscription.currentPeriodEnd = periodEnd;

        await this.subscriptionRepository.save(subscription);
      }

      return {
        success: true,
        payment,
        verification,
      };
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = {
        ...payment.metadata,
        error: error.message,
        failedAt: new Date().toISOString(),
      };
      await this.paymentRepository.save(payment);
      throw error;
    }
  }

  async getPaymentHistory(subscriptionId: string) {
    return await this.paymentRepository.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });
  }

  getPlanPricing() {
    return Object.entries(PLAN_PRICING).map(([plan, details]) => ({
      plan,
      ...details,
      features: this.getPlanFeatures(plan as SubscriptionPlan),
    }));
  }

  private getPlanFeatures(plan: SubscriptionPlan): string[] {
    const features = {
      [SubscriptionPlan.FREE]: [
        'Up to 3 projects',
        'Up to 5 team members',
        '100 reviews per month',
        'Basic AI code review',
        'GitHub & GitLab integration',
        'Discord notifications',
      ],
      [SubscriptionPlan.STARTER]: [
        'Up to 10 projects',
        'Up to 10 team members',
        '1,000 reviews per month',
        'Advanced AI code review',
        'Priority support',
        'Custom review rules',
        'All FREE features',
      ],
      [SubscriptionPlan.PROFESSIONAL]: [
        'Up to 50 projects',
        'Up to 25 team members',
        '5,000 reviews per month',
        'AI training from feedback',
        'Advanced analytics',
        'API access',
        'All STARTER features',
      ],
      [SubscriptionPlan.ENTERPRISE]: [
        'Unlimited projects',
        'Unlimited team members',
        'Unlimited reviews',
        'Dedicated support',
        'Custom AI model training',
        'SLA guarantee',
        'All PROFESSIONAL features',
      ],
    };

    return features[plan] || [];
  }
}
