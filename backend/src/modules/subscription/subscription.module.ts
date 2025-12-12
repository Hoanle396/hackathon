import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { Subscription } from './subscription.entity';
import { Payment } from './payment.entity';
import { Web3PaymentService } from './web3-payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Payment]),
    ConfigModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, Web3PaymentService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
