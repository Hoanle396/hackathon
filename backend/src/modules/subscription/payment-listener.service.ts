import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import { Payment, PaymentStatus } from './payment.entity';
import { Web3PaymentService } from './web3-payment.service';
import { SubscriptionService } from './subscription.service';

const USDT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

@Injectable()
export class PaymentListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentListenerService.name);
  private provider: ethers.Provider;
  private usdtContract: ethers.Contract;
  private receiverAddress: string;
  private isListening = false;
  private crawlInterval: NodeJS.Timeout;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private web3PaymentService: Web3PaymentService,
    @Inject(forwardRef(() => SubscriptionService))
    private subscriptionService: SubscriptionService,
    private configService: ConfigService,
  ) {
    const rpcUrl = this.configService.get<string>('RPC_URL') || 'https://rpc-amoy.polygon.technology';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.receiverAddress = this.configService.get<string>('WEB3_RECEIVER_ADDRESS');
    
    // Get USDT contract address from config or service
    const usdtAddress = this.configService.get<string>('USDT_CONTRACT') || '0x...';
    this.usdtContract = new ethers.Contract(usdtAddress, USDT_ABI, this.provider);
  }

  /**
   * Start listening when module initializes
   */
  async onModuleInit() {
    this.logger.log('🚀 Starting Payment Listener Service...');
    
    // Start event listener
    await this.startEventListener();
    
    // Start periodic crawler for missed transactions
    this.startPeriodicCrawler();
    
    // Do initial crawl on startup
    await this.crawlPendingPayments();
  }

  /**
   * Stop listening when module is destroyed
   */
  async onModuleDestroy() {
    this.logger.log('🛑 Stopping Payment Listener Service...');
    this.stopEventListener();
    if (this.crawlInterval) {
      clearInterval(this.crawlInterval);
    }
  }

  /**
   * Start listening to USDT Transfer events
   */
  private async startEventListener() {
    if (this.isListening) return;

    try {
      this.logger.log(`👂 Listening to USDT Transfer events for receiver: ${this.receiverAddress}`);
      
      // Listen to Transfer events where 'to' is our receiver address
      const filter = this.usdtContract.filters.Transfer(null, this.receiverAddress);
      
      this.usdtContract.on(filter, async (...args) => {
        // Extract event data - last argument is the event object
        const event = args[args.length - 1];
        const from = event.args[0];
        const to = event.args[1];
        const amount = event.args[2];
        
        this.logger.log(`💰 New USDT transfer detected!`);
        this.logger.log(`   From: ${from}`);
        this.logger.log(`   To: ${to}`);
        this.logger.log(`   Amount: ${ethers.formatUnits(amount, 6)} USDT`);
        this.logger.log(`   Tx: ${event.log.transactionHash}`);
        
        // Process the payment
        await this.processTransferEvent(event.log.transactionHash, from, to, amount);
      });

      this.isListening = true;
      this.logger.log('✅ Event listener started successfully');
    } catch (error) {
      this.logger.error('❌ Failed to start event listener:', error);
    }
  }

  /**
   * Stop listening to events
   */
  private stopEventListener() {
    if (!this.isListening) return;

    try {
      this.usdtContract.removeAllListeners();
      this.isListening = false;
      this.logger.log('✅ Event listener stopped');
    } catch (error) {
      this.logger.error('❌ Failed to stop event listener:', error);
    }
  }

  /**
   * Process a transfer event
   */
  private async processTransferEvent(
    transactionHash: string,
    from: string,
    to: string,
    amount: bigint,
  ) {
    try {
      // First try to find by transaction hash
      let payment = await this.paymentRepository.findOne({
        where: {
          transactionHash: transactionHash,
        },
      });

      // If found by txHash, check if already processed
      if (payment) {
        if (payment.status === PaymentStatus.SUCCEEDED) {
          this.logger.log(`ℹ️  Payment ${payment.id} already processed`);
          return;
        }
      } else {
        // Find pending payment matching sender address
        payment = await this.paymentRepository.findOne({
          where: {
            status: PaymentStatus.PENDING,
            fromAddress: from.toLowerCase(),
          },
          order: { createdAt: 'DESC' },
        });

        // If still not found, try without fromAddress (might not be set yet)
        if (!payment) {
          payment = await this.paymentRepository.findOne({
            where: {
              status: PaymentStatus.PENDING,
            },
            order: { createdAt: 'DESC' },
          });

          if (payment) {
            this.logger.log(`📝 Found pending payment without fromAddress, updating...`);
            payment.fromAddress = from.toLowerCase();
          }
        }
      }

      if (!payment) {
        this.logger.warn(`⚠️  No pending payment found for address ${from}`);
        this.logger.warn(`   Transaction: ${transactionHash}`);
        this.logger.warn(`   Amount: ${ethers.formatUnits(amount, 6)} USDT`);
        return;
      }

      // Update payment with transaction hash if not set
      if (!payment.transactionHash) {
        payment.transactionHash = transactionHash;
        await this.paymentRepository.save(payment);
        this.logger.log(`📝 Updated payment ${payment.id} with transaction hash`);
      }

      // Verify and confirm the payment
      this.logger.log(`🔍 Verifying payment ${payment.id}...`);
      await this.subscriptionService.verifyPaymentTransaction(payment.id, transactionHash);
      
      this.logger.log(`✅ Payment ${payment.id} verified and subscription activated!`);
    } catch (error) {
      this.logger.error(`❌ Failed to process transfer event:`, error.message);
    }
  }

  /**
   * Start periodic crawler to catch any missed transactions
   * Runs every 2 minutes
   */
  private startPeriodicCrawler() {
    this.logger.log('⏰ Starting periodic crawler (every 2 minutes)...');
    
    this.crawlInterval = setInterval(async () => {
      await this.crawlPendingPayments();
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  /**
   * Crawl all pending payments and verify them
   */
  async crawlPendingPayments() {
    try {
      const pendingPayments = await this.paymentRepository.find({
        where: { status: PaymentStatus.PENDING },
        order: { createdAt: 'DESC' },
        take: 50, // Limit to last 50
      });

      if (pendingPayments.length === 0) {
        return;
      }

      this.logger.log(`🔍 Crawling ${pendingPayments.length} pending payments...`);

      let verified = 0;
      let failed = 0;

      for (const payment of pendingPayments) {
        // Check if payment has expired (30 minutes)
        const expiresAt = payment.metadata?.expiresAt;
        if (expiresAt && Date.now() > expiresAt) {
          continue;
        }

        // Skip if no transaction hash yet (user hasn't sent)
        if (!payment.transactionHash) {
          continue;
        }

        // Skip if no signature (user hasn't signed)
        if (!payment.metadata?.signature) {
          continue;
        }

        try {
          await this.subscriptionService.verifyPaymentTransaction(
            payment.id,
            payment.transactionHash,
          );
          verified++;
          this.logger.log(`✅ Payment ${payment.id} verified`);
        } catch (error) {
          failed++;
          this.logger.warn(`⚠️  Payment ${payment.id} verification failed: ${error.message}`);
        }
      }

      if (verified > 0 || failed > 0) {
        this.logger.log(`📊 Crawl complete: ${verified} verified, ${failed} failed`);
      }
    } catch (error) {
      this.logger.error('❌ Crawl error:', error);
    }
  }

  /**
   * Get listener status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      receiverAddress: this.receiverAddress,
      contractAddress: this.usdtContract.target,
      provider: this.provider ? 'Connected' : 'Disconnected',
    };
  }
}
