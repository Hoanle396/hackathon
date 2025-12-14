# Backend Updates Required for Sepolia Migration

## Overview
The frontend has been migrated from Polygon Amoy to Sepolia testnet. The backend needs corresponding updates to handle payments and transactions on the new network.

## Critical Updates Needed

### 1. Chain Configuration

Update chain ID in all relevant files:

```typescript
// Old (Polygon Amoy)
const CHAIN_ID = 80002;

// New (Sepolia)
const CHAIN_ID = 11155111;
```

**Files to Update:**
- `backend/src/modules/subscription/web3-payment.service.ts`
- `backend/src/modules/subscription/payment-listener.service.ts`
- Any config files with chain ID references

### 2. RPC Endpoints

Update RPC URLs to use Sepolia providers:

```typescript
// Old
const RPC_URL = 'https://rpc-amoy.polygon.technology';

// New (Choose one)
const RPC_URL = 'https://sepolia.infura.io/v3/YOUR_API_KEY';
// OR
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY';
// OR
const RPC_URL = 'https://rpc.sepolia.org'; // Public
```

**Environment Variables:**
```bash
# .env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
WEB3_PROVIDER_URL=${SEPOLIA_RPC_URL}
CHAIN_ID=11155111
```

### 3. USDT Contract Address

Update the USDT contract address:

```typescript
// Old (Amoy)
const USDT_CONTRACT_ADDRESS = '0x741A2E7604D850Af2bDf20B27616BA33Fad71E75';

// New (Sepolia) - PLACEHOLDER
const USDT_CONTRACT_ADDRESS = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';
```

⚠️ **Important**: You need to either:
1. Deploy your own test ERC20 token to Sepolia
2. Find an existing USDT-like token on Sepolia
3. Use a different test token

**Deployment Option:**
```bash
cd contracts
pnpm install
pnpm run deploy:sepolia
# Use the deployed contract address
```

### 4. Block Explorer URLs

Update transaction verification URLs:

```typescript
// Old
const explorerUrl = `https://amoy.polygonscan.com/tx/${txHash}`;

// New
const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
```

### 5. Payment Listener Service

Update the payment listener to monitor Sepolia:

**File**: `backend/src/modules/subscription/payment-listener.service.ts`

Key changes needed:
```typescript
// Provider initialization
const provider = new ethers.JsonRpcProvider(
  process.env.SEPOLIA_RPC_URL,
  {
    chainId: 11155111,
    name: 'sepolia',
  }
);

// Event listener setup
const contract = new ethers.Contract(
  USDT_CONTRACT_ADDRESS,
  USDT_ABI,
  provider
);

// Listen for Transfer events on Sepolia
contract.on('Transfer', async (from, to, amount, event) => {
  // Handle payment verification
  console.log('Sepolia Transfer detected:', {
    from,
    to,
    amount: ethers.formatUnits(amount, 6),
    txHash: event.log.transactionHash,
    blockNumber: event.log.blockNumber,
  });
});
```

### 6. Database Schema

Ensure the Payment entity stores the correct chain info:

```typescript
@Entity()
export class Payment {
  @Column({ nullable: true })
  chainId: number; // Should be 11155111 for Sepolia

  @Column({ nullable: true })
  chainName: string; // Should be 'Sepolia'
  
  // ... other fields
}
```

### 7. Payment Request Creation

Update the payment request endpoint:

**File**: `backend/src/modules/subscription/subscription.service.ts`

```typescript
async createPaymentRequest(subscriptionId: string, amount: number) {
  const paymentId = uuidv4();
  const salt = randomBytes(32).toString('hex');
  
  const chainInfo = {
    chainId: 11155111, // Sepolia
    name: 'Sepolia',
    usdtAddress: USDT_CONTRACT_ADDRESS,
  };
  
  const message = `Payment for subscription ${subscriptionId}\nAmount: ${amount} USDT\nPayment ID: ${paymentId}\nSalt: ${salt}`;
  
  return {
    paymentId,
    salt,
    message,
    amount,
    receiverAddress: process.env.RECEIVER_WALLET_ADDRESS,
    chainInfo,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  };
}
```

### 8. Transaction Verification

Update transaction verification to use Sepolia:

```typescript
async verifyTransaction(
  txHash: string,
  expectedAmount: number,
  receiverAddress: string
): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  try {
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt || receipt.status !== 1) {
      return false;
    }
    
    // Verify chain ID
    if (tx.chainId !== 11155111n) {
      return false;
    }
    
    // Parse transfer event from logs
    const transferEvent = receipt.logs.find(
      log => log.address.toLowerCase() === USDT_CONTRACT_ADDRESS.toLowerCase()
    );
    
    // Verify amount and receiver
    // ... verification logic
    
    return true;
  } catch (error) {
    console.error('Transaction verification failed:', error);
    return false;
  }
}
```

## Environment Variables Checklist

Update `.env` file:

```bash
# Sepolia Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
CHAIN_ID=11155111

# Contract Addresses
USDT_CONTRACT_ADDRESS=0x7169D38820dfd117C3FA1f22a697dBA58d90BA06

# Wallet Configuration
RECEIVER_WALLET_ADDRESS=0x... # Your payment receiver address
PRIVATE_KEY=0x... # If needed for automated operations

# Block Explorer
EXPLORER_URL=https://sepolia.etherscan.io
```

## Testing Checklist

- [ ] Update RPC endpoint to Sepolia
- [ ] Update chain ID to 11155111
- [ ] Update USDT contract address
- [ ] Update block explorer URLs
- [ ] Test payment listener service starts correctly
- [ ] Test event monitoring works
- [ ] Test transaction verification
- [ ] Test payment creation endpoint
- [ ] Test signature verification
- [ ] Test database storage with new chain ID
- [ ] Verify error handling for wrong chain
- [ ] Test end-to-end payment flow
- [ ] Check logs show Sepolia transactions
- [ ] Verify automatic payment detection works

## RPC Provider Options

### 1. Alchemy (Recommended)
- Free tier: 300M compute units/month
- Sign up: https://alchemy.com
- URL: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

### 2. Infura
- Free tier: 100k requests/day
- Sign up: https://infura.io
- URL: `https://sepolia.infura.io/v3/YOUR_API_KEY`

### 3. Public RPC (Not recommended for production)
- URL: `https://rpc.sepolia.org`
- Rate limited, may be unreliable

## Migration Steps

1. **Backup Current State**
   ```bash
   # Backup database
   pg_dump your_db > backup_before_sepolia.sql
   ```

2. **Update Environment Variables**
   ```bash
   cp .env .env.backup
   # Edit .env with new Sepolia config
   ```

3. **Update Code**
   - Update all chain ID references
   - Update RPC URLs
   - Update contract addresses
   - Update explorer URLs

4. **Test Locally**
   ```bash
   # Start services
   pnpm run start:dev
   
   # Monitor logs
   tail -f logs/app.log
   ```

5. **Verify Listener**
   - Send test transaction on Sepolia
   - Check if listener detects it
   - Verify payment status updates

6. **Deploy to Staging**
   - Test full payment flow
   - Verify with real wallet transactions
   - Check error handling

7. **Deploy to Production**
   - Update production environment variables
   - Deploy backend changes
   - Monitor for any issues

## Monitoring

Add logging for Sepolia transactions:

```typescript
this.logger.log('Payment listener started on Sepolia', {
  chainId: 11155111,
  chainName: 'Sepolia',
  usdtContract: USDT_CONTRACT_ADDRESS,
  rpcUrl: process.env.SEPOLIA_RPC_URL?.slice(0, 50) + '...',
});
```

## Troubleshooting

### Listener Not Detecting Transactions
- Check RPC URL is correct
- Verify USDT contract address
- Ensure provider is connected
- Check event filters are correct

### Transaction Verification Failing
- Verify transaction is on Sepolia (chain ID 11155111)
- Check USDT contract address matches
- Ensure transaction is confirmed (not pending)
- Verify logs parsing is correct

### RPC Rate Limiting
- Use a paid tier for production
- Implement retry logic with exponential backoff
- Consider multiple RPC providers for fallback

## Resources

- **Sepolia RPC**: https://chainlist.org/chain/11155111
- **Sepolia Explorer**: https://sepolia.etherscan.io
- **Sepolia Faucet**: https://sepoliafaucet.com
- **Alchemy**: https://www.alchemy.com
- **Infura**: https://www.infura.io

## Contact

For questions about the frontend changes, check:
- `frontend/WAGMI_MIGRATION.md`
- `frontend/WAGMI_UPDATE_SUMMARY.md`

---

**Priority**: HIGH
**Status**: Requires Implementation
**Estimated Time**: 2-4 hours
