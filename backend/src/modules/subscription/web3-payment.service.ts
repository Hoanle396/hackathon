import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { randomBytes } from 'crypto';

// USDT Token ABI (minimal interface for transfers)
const USDT_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

// Polygon Testnet USDT Contract Address
const CHAIN_ID = 11155111;
const USDT_CONTRACT_ADDRESS = '0x741A2E7604D850Af2bDf20B27616BA33Fad71E75'; // TODO: Replace with actual USDT contract on Amoy

export interface PaymentRequest {
  salt: string;
  amount: number;
  userId: string;
  subscriptionId: string;
  expiresAt: number;
}

export interface PaymentVerification {
  isValid: boolean;
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  amountUSD: number;
  blockNumber: number;
  timestamp: number;
  userId: string;
}

@Injectable()
export class Web3PaymentService {
  private readonly logger = new Logger(Web3PaymentService.name);
  private provider: ethers.Provider;
  private receiverAddress: string;
  private pendingPayments: Map<string, PaymentRequest> = new Map();

  constructor(private configService: ConfigService) {
    this.receiverAddress = this.configService.get<string>('WEB3_RECEIVER_ADDRESS');
    const rpcUrl = this.configService.get<string>('RPC_URL') || 'https://rpc-amoy.polygon.technology';
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    this.logger.log(`Initialized Web3 Payment Service for Amoy Testnet`);
    this.logger.log(`Receiver Address: ${this.receiverAddress}`);
  }

  /**
   * Generate payment request with salt
   */
  generatePaymentRequest(
    userId: string,
    subscriptionId: string,
    amount: number,
  ): PaymentRequest {
    const salt = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    const paymentRequest: PaymentRequest = {
      salt,
      amount,
      userId,
      subscriptionId,
      expiresAt,
    };

    this.pendingPayments.set(salt, paymentRequest);

    // Auto cleanup after expiration
    setTimeout(() => {
      this.pendingPayments.delete(salt);
    }, 30 * 60 * 1000);

    return paymentRequest;
  }

  /**
   * Generate message for user to sign
   */
  generateSignatureMessage(paymentRequest: PaymentRequest): string {
    return `Payment Request\nAmount: ${paymentRequest.amount} USDT\nSalt: ${paymentRequest.salt}\nUser ID: ${paymentRequest.userId}\nSubscription ID: ${paymentRequest.subscriptionId}`;
  }

  /**
   * Verify signature from user
   */
  async verifySignature(
    salt: string,
    signature: string,
    userAddress: string,
  ): Promise<boolean> {
    const paymentRequest = this.pendingPayments.get(salt);

    if (!paymentRequest) {
      throw new BadRequestException('Invalid or expired payment request');
    }

    if (Date.now() > paymentRequest.expiresAt) {
      this.pendingPayments.delete(salt);
      throw new BadRequestException('Payment request expired');
    }

    try {
      const message = this.generateSignatureMessage(paymentRequest);
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
        throw new BadRequestException('Invalid signature');
      }

      return true;
    } catch (error) {
      this.logger.error('Signature verification failed:', error);
      throw new BadRequestException('Signature verification failed');
    }
  }

  /**
   * Admin crawl and verify transaction on-chain
   */
  async verifyPaymentTransaction(
    transactionHash: string,
    salt: string,
  ): Promise<PaymentVerification> {
    const paymentRequest = this.pendingPayments.get(salt);

    if (!paymentRequest) {
      throw new BadRequestException('Invalid or expired payment request');
    }

    try {
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        throw new BadRequestException('Transaction not found or not yet confirmed');
      }

      if (receipt.status !== 1) {
        throw new BadRequestException('Transaction failed');
      }

      // Parse USDT transfer event from logs
      const usdtInterface = new ethers.Interface(USDT_ABI);
      let transferLog = null;
      
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === USDT_CONTRACT_ADDRESS.toLowerCase()) {
          try {
            const parsed = usdtInterface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
            
            if (parsed?.name === 'Transfer') {
              transferLog = parsed;
              break;
            }
          } catch (e) {
            // Not a Transfer event, continue
          }

        }
      }

      if (!transferLog) {
        throw new BadRequestException('No USDT transfer found in transaction');
      }

      const from = transferLog.args.from.toLowerCase();
      const to = transferLog.args.to.toLowerCase();
      const amount = transferLog.args.value;

      // Verify recipient is our receiver address
      if (to !== this.receiverAddress.toLowerCase()) {
        throw new BadRequestException('Payment sent to wrong address');
      }

      // Convert amount from USDT decimals (6) to USD
      const amountUSD = Number(ethers.formatUnits(amount, 6));

      // Verify amount (allow 1% tolerance)
      const tolerance = paymentRequest.amount * 0.01;
      if (Math.abs(amountUSD - paymentRequest.amount) > tolerance) {
        throw new BadRequestException(
          `Amount mismatch. Expected: ${paymentRequest.amount} USDT, Received: ${amountUSD} USDT`,
        );
      }

      // Get block timestamp
      const block = await this.provider.getBlock(receipt.blockNumber);

      // Remove from pending after successful verification
      this.pendingPayments.delete(salt);
      
      return {
        isValid: true,
        transactionHash: receipt.hash,
        from,
        to,
        amount: amount.toString(),
        amountUSD,
        blockNumber: receipt.blockNumber,
        timestamp: block?.timestamp || 0,
        userId: paymentRequest.userId,
      };
    } catch (error) {
      this.logger.error('Payment verification failed:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to verify payment: ' + error.message);
    }
  }

  /**
   * Get USDT balance of an address
   */
  async getUSDTBalance(address: string): Promise<string> {
    try {
      const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, this.provider);
      const balance = await usdtContract.balanceOf(address);
      return ethers.formatUnits(balance, 6);
    } catch (error) {
      this.logger.error('Failed to get USDT balance:', error);
      throw new BadRequestException('Failed to get USDT balance');
    }
  }

  getReceiverAddress(): string {
    return this.receiverAddress;
  }

  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  getChainInfo() {
    return {
      chainId: CHAIN_ID,
      name: 'Polygon Testnet',
      usdtAddress: USDT_CONTRACT_ADDRESS,
      rpcUrl: this.configService.get<string>('RPC_URL') || 'https://rpc-amoy.polygon.technology',
    };
  }

  getPaymentRequest(salt: string): PaymentRequest | undefined {
    return this.pendingPayments.get(salt);
  }
}
