import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentListenerService } from './payment-listener.service';

@ApiTags('subscriptions')
@ApiBearerAuth('JWT-auth')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentListenerService: PaymentListenerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  create(@Request() req, @Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.create(req.user.id, createSubscriptionDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'Returns user subscription' })
  findMine(@Request() req) {
    return this.subscriptionService.findByUser(req.user.id);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Get team subscription' })
  @ApiResponse({ status: 200, description: 'Returns team subscription' })
  findByTeam(@Param('teamId') teamId: string) {
    return this.subscriptionService.findByTeam(teamId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available plans and pricing' })
  @ApiResponse({ status: 200, description: 'Returns pricing plans' })
  getPlans() {
    return this.subscriptionService.getPlanPricing();
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get subscription usage' })
  @ApiResponse({ status: 200, description: 'Returns usage statistics' })
  getUsage(@Param('id') id: string) {
    return this.subscriptionService.getUsage(id);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({ status: 200, description: 'Returns payment history' })
  getPaymentHistory(@Param('id') id: string) {
    return this.subscriptionService.getPaymentHistory(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated' })
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled' })
  cancel(@Param('id') id: string) {
    return this.subscriptionService.cancel(id);
  }

  @Post(':id/reset-usage')
  @ApiOperation({ summary: 'Reset monthly usage (admin only)' })
  @ApiResponse({ status: 200, description: 'Usage reset' })
  resetUsage(@Param('id') id: string) {
    return this.subscriptionService.resetMonthlyUsage(id);
  }

  @Post(':id/payment/request')
  @ApiOperation({ summary: 'Create USDT payment request with salt (Step 1)' })
  @ApiResponse({ status: 201, description: 'Payment request created with salt and message to sign' })
  createPaymentRequest(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.subscriptionService.createPaymentRequest(
      req.user.id,
      id,
      body.amount,
    );
  }
 
  @Post('payment/:paymentId/signature')
  @ApiOperation({ summary: 'Submit payment signature (Step 2)' })
  @ApiResponse({ status: 200, description: 'Signature verified, ready for USDT transfer' })
  submitPaymentSignature(
    @Param('paymentId') paymentId: string,
    @Body() body: { signature: string; walletAddress: string },
  ) {
    return this.subscriptionService.submitPaymentSignature(
      paymentId,
      body.signature,
      body.walletAddress,
    );
  }

  @Post('payment/:paymentId/verify')
  @ApiOperation({ summary: 'Verify USDT transaction on-chain (Step 3 - Admin)' })
  @ApiResponse({ status: 200, description: 'Payment verified and subscription activated' })
  verifyPaymentTransaction(
    @Param('paymentId') paymentId: string,
    @Body() body: { transactionHash: string },
  ) {
    return this.subscriptionService.verifyPaymentTransaction(
      paymentId,
      body.transactionHash,
    );
  }

  @Get('payment/listener/status')
  @ApiOperation({ summary: 'Get payment listener status' })
  @ApiResponse({ status: 200, description: 'Returns listener status' })
  getListenerStatus() {
    return this.paymentListenerService.getStatus();
  }

  @Post('payment/listener/crawl')
  @ApiOperation({ summary: 'Manually trigger payment crawl (admin only)' })
  @ApiResponse({ status: 200, description: 'Crawl triggered' })
  async triggerCrawl() {
    await this.paymentListenerService.crawlPendingPayments();
    return { message: 'Crawl completed' };
  }
}
