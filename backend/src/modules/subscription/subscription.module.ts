import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { Subscription } from './subscription.entity';
import { Payment } from './payment.entity';
import { Web3PaymentService } from './web3-payment.service';
import { PaymentListenerService } from './payment-listener.service';
import { SubscriptionCleanupService } from './subscription-cleanup.service';
import { Team } from '../team/team.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Payment, Team]),
    ConfigModule,
  ],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    Web3PaymentService,
    PaymentListenerService,
    SubscriptionCleanupService,
  ],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
