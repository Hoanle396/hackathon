import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

// USDC Token ABI (minimal interface for transfers)
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

// Supported chains
export enum SupportedChain {
  ETHEREUM_MAINNET = 1,
  ETHEREUM_SEPOLIA = 11155111,
  POLYGON_MAINNET = 137,
  POLYGON_MUMBAI = 80001,
  ARBITRUM_MAINNET = 42161,
  ARBITRUM_SEPOLIA = 421614,
  BASE_MAINNET = 8453,
  BASE_SEPOLIA = 84532,
}

// USDC contract addresses per chain
const USDC_ADDRESSES: Record<number, string> = {
  [SupportedChain.ETHEREUM_MAINNET]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [SupportedChain.ETHEREUM_SEPOLIA]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  [SupportedChain.POLYGON_MAINNET]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  [SupportedChain.POLYGON_MUMBAI]: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
  [SupportedChain.ARBITRUM_MAINNET]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [SupportedChain.ARBITRUM_SEPOLIA]: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  [SupportedChain.BASE_MAINNET]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [SupportedChain.BASE_SEPOLIA]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

export interface PaymentVerification {
  isValid: boolean;
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  amountUSD: number;
  chainId: number;
  blockNumber: number;
  timestamp: number;
}

@Injectable()
export class Web3PaymentService {
  private readonly logger = new Logger(Web3PaymentService.name);
  private providers: Map<number, ethers.Provider> = new Map();
  private receiverAddress: string;

  constructor(private configService: ConfigService) {
    this.receiverAddress = this.configService.get<string>('WEB3_RECEIVER_ADDRESS');
    this.initializeProviders();
  }

  private initializeProviders() {
    const rpcUrls = {
      [SupportedChain.ETHEREUM_MAINNET]: this.configService.get<string>('ETHEREUM_RPC_URL'),
      [SupportedChain.ETHEREUM_SEPOLIA]: this.configService.get<string>('ETHEREUM_SEPOLIA_RPC_URL'),
      [SupportedChain.POLYGON_MAINNET]: this.configService.get<string>('POLYGON_RPC_URL'),
      [SupportedChain.POLYGON_MUMBAI]: this.configService.get<string>('POLYGON_MUMBAI_RPC_URL'),
      [SupportedChain.ARBITRUM_MAINNET]: this.configService.get<string>('ARBITRUM_RPC_URL'),
      [SupportedChain.ARBITRUM_SEPOLIA]: this.configService.get<string>('ARBITRUM_SEPOLIA_RPC_URL'),
      [SupportedChain.BASE_MAINNET]: this.configService.get<string>('BASE_RPC_URL'),
      [SupportedChain.BASE_SEPOLIA]: this.configService.get<string>('BASE_SEPOLIA_RPC_URL'),
    };

    for (const [chainId, rpcUrl] of Object.entries(rpcUrls)) {
      if (rpcUrl) {
        try {
          this.providers.set(Number(chainId), new ethers.JsonRpcProvider(rpcUrl));
          this.logger.log(`Initialized provider for chain ${chainId}`);
        } catch (error) {
          this.logger.error(`Failed to initialize provider for chain ${chainId}:`, error);
        }
      }
    }
  }

  async verifyPayment(
    transactionHash: string,
    expectedAmount: number,
    chainId: number,
  ): Promise<PaymentVerification> {
    const provider = this.providers.get(chainId);
    
    if (!provider) {
      throw new BadRequestException(`Unsupported chain ID: ${chainId}`);
    }

    const usdcAddress = USDC_ADDRESSES[chainId];
    if (!usdcAddress) {
      throw new BadRequestException(`USDC not supported on chain ${chainId}`);
    }

    try {
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        throw new BadRequestException('Transaction not found or not yet confirmed');
      }

      if (receipt.status !== 1) {
        throw new BadRequestException('Transaction failed');
      }

      // Get transaction details
      const transaction = await provider.getTransaction(transactionHash);
      
      if (!transaction) {
        throw new BadRequestException('Transaction details not found');
      }

      // Parse USDC transfer event from logs
      const usdcInterface = new ethers.Interface(USDC_ABI);
      let transferLog = null;
      
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === usdcAddress.toLowerCase()) {
          try {
            const parsed = usdcInterface.parseLog({
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
        throw new BadRequestException('No USDC transfer found in transaction');
      }

      const from = transferLog.args.from.toLowerCase();
      const to = transferLog.args.to.toLowerCase();
      const amount = transferLog.args.value;

      // Verify recipient is our receiver address
      if (to !== this.receiverAddress.toLowerCase()) {
        throw new BadRequestException('Payment sent to wrong address');
      }

      // Convert amount from USDC decimals (6) to USD
      const amountUSD = Number(ethers.formatUnits(amount, 6));

      // Verify amount (allow 1% tolerance for gas/slippage)
      const tolerance = expectedAmount * 0.01;
      if (Math.abs(amountUSD - expectedAmount) > tolerance) {
        throw new BadRequestException(
          `Amount mismatch. Expected: ${expectedAmount} USDC, Received: ${amountUSD} USDC`,
        );
      }

      // Get block timestamp
      const block = await provider.getBlock(receipt.blockNumber);
      
      return {
        isValid: true,
        transactionHash: receipt.hash,
        from,
        to,
        amount: amount.toString(),
        amountUSD,
        chainId,
        blockNumber: receipt.blockNumber,
        timestamp: block?.timestamp || 0,
      };
    } catch (error) {
      this.logger.error('Payment verification failed:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to verify payment: ' + error.message);
    }
  }

  async getUSDCBalance(address: string, chainId: number): Promise<string> {
    const provider = this.providers.get(chainId);
    
    if (!provider) {
      throw new BadRequestException(`Unsupported chain ID: ${chainId}`);
    }

    const usdcAddress = USDC_ADDRESSES[chainId];
    if (!usdcAddress) {
      throw new BadRequestException(`USDC not supported on chain ${chainId}`);
    }

    try {
      const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, provider);
      const balance = await usdcContract.balanceOf(address);
      return ethers.formatUnits(balance, 6);
    } catch (error) {
      this.logger.error('Failed to get USDC balance:', error);
      throw new BadRequestException('Failed to get USDC balance');
    }
  }

  getReceiverAddress(): string {
    return this.receiverAddress;
  }

  getSupportedChains(): Array<{ chainId: number; name: string; usdcAddress: string }> {
    return Object.entries(USDC_ADDRESSES).map(([chainId, usdcAddress]) => ({
      chainId: Number(chainId),
      name: this.getChainName(Number(chainId)),
      usdcAddress,
    }));
  }

  private getChainName(chainId: number): string {
    const names: Record<number, string> = {
      [SupportedChain.ETHEREUM_MAINNET]: 'Ethereum',
      [SupportedChain.ETHEREUM_SEPOLIA]: 'Ethereum Sepolia',
      [SupportedChain.POLYGON_MAINNET]: 'Polygon',
      [SupportedChain.POLYGON_MUMBAI]: 'Polygon Mumbai',
      [SupportedChain.ARBITRUM_MAINNET]: 'Arbitrum',
      [SupportedChain.ARBITRUM_SEPOLIA]: 'Arbitrum Sepolia',
      [SupportedChain.BASE_MAINNET]: 'Base',
      [SupportedChain.BASE_SEPOLIA]: 'Base Sepolia',
    };
    return names[chainId] || `Chain ${chainId}`;
  }

  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}
