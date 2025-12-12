# USDC On-Chain Payment Integration

This document describes the complete implementation of USDC on-chain payments for subscription management, replacing Stripe.

## Overview

The application now uses **USDC (USD Coin)** cryptocurrency for subscription payments. Users pay directly on-chain using their Web3 wallets (MetaMask, etc.) on multiple supported networks.

## Supported Networks

The integration supports USDC payments on the following networks:

### Mainnet Networks
- **Ethereum** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Arbitrum** (Chain ID: 42161)
- **Base** (Chain ID: 8453)

### Testnet Networks
- **Ethereum Sepolia** (Chain ID: 11155111)
- **Polygon Mumbai** (Chain ID: 80001)
- **Arbitrum Sepolia** (Chain ID: 421614)
- **Base Sepolia** (Chain ID: 84532)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install ethers
```

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Web3 Payment Configuration
WEB3_RECEIVER_ADDRESS=0xYourWalletAddressHere

# Ethereum RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
ETHEREUM_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY

# Polygon RPC URLs
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR-API-KEY

# Arbitrum RPC URLs
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR-API-KEY
ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR-API-KEY

# Base RPC URLs
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY
```

**Important:** 
- Set `WEB3_RECEIVER_ADDRESS` to your company's wallet address where you want to receive USDC payments
- Get RPC URLs from providers like [Alchemy](https://www.alchemy.com/), [Infura](https://infura.io/), or [QuickNode](https://www.quicknode.com/)

### 3. Database Migration

Run database migration to update the entities:

```bash
cd backend
npm run migration:generate -- -n RemoveStripeAddWeb3
npm run migration:run
```

## Backend Architecture

### Services

#### **Web3PaymentService** (`web3-payment.service.ts`)

Handles all blockchain interactions:

- `verifyPayment(txHash, expectedAmount, chainId)`: Verifies USDC transaction on-chain
- `getUSDCBalance(address, chainId)`: Checks USDC balance
- `getSupportedChains()`: Returns list of supported networks
- `isValidAddress(address)`: Validates Ethereum addresses

#### **SubscriptionService** (`subscription.service.ts`)

Updated methods:

- `createPayment(subscriptionId, amount, walletAddress, metadata)`: Creates payment record and returns receiver address + supported chains
- `verifyAndConfirmPayment(paymentId, txHash, chainId)`: Verifies blockchain transaction and activates subscription

### API Endpoints

#### Create Payment Intent
```http
POST /api/v1/subscriptions/:id/payment
Authorization: Bearer <token>

Request:
{
  "amount": 29,
  "walletAddress": "0x123...",
  "metadata": {
    "plan": "STARTER"
  }
}

Response:
{
  "payment": {
    "id": "payment-uuid",
    "amount": 29,
    "currency": "USDC",
    "status": "pending"
  },
  "receiverAddress": "0xCompanyWallet...",
  "supportedChains": [
    {
      "chainId": 1,
      "name": "Ethereum",
      "usdcAddress": "0xA0b86991..."
    },
    ...
  ],
  "amount": 29
}
```

#### Verify Payment
```http
POST /api/v1/subscriptions/payment/:paymentId/verify
Authorization: Bearer <token>

Request:
{
  "transactionHash": "0xabc123...",
  "chainId": 137
}

Response:
{
  "success": true,
  "payment": {
    "id": "payment-uuid",
    "status": "succeeded",
    "transactionHash": "0xabc123...",
    "chainId": 137,
    "blockNumber": 12345678
  },
  "verification": {
    "isValid": true,
    "from": "0xUserWallet...",
    "to": "0xCompanyWallet...",
    "amount": "29000000",
    "amountUSD": 29,
    "timestamp": 1234567890
  }
}
```

### Entity Updates

#### Payment Entity
```typescript
// Removed
- stripePaymentIntentId
- stripeChargeId
- receiptUrl

// Added
+ transactionHash: string
+ fromAddress: string
+ toAddress: string
+ chainId: number
+ blockNumber: number
```

#### Subscription Entity
```typescript
// Removed
- stripeCustomerId
- stripeSubscriptionId

// Added
+ walletAddress: string
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install ethers
```

### 2. Wallet Integration

The billing page now includes:

- **Wallet Connection**: Connect/disconnect MetaMask or other Web3 wallets
- **Multi-Chain Support**: Choose which network to pay on
- **Transaction Tracking**: View transaction status on block explorers
- **Payment History**: See all USDC payments with blockchain links

### 3. Payment Flow

1. User connects Web3 wallet (MetaMask)
2. User selects a subscription plan
3. System creates payment intent with receiver address
4. User selects network (Ethereum, Polygon, Arbitrum, or Base)
5. Frontend initiates USDC transfer via smart contract
6. User confirms transaction in wallet
7. Transaction is sent to blockchain
8. Frontend waits for confirmation
9. Backend verifies transaction on-chain
10. Subscription is activated automatically

## Payment Flow Diagram

```
┌─────────┐      ┌──────────┐      ┌────────────┐      ┌──────────┐
│  User   │─────▶│ Frontend │─────▶│  Backend   │─────▶│Blockchain│
└─────────┘      └──────────┘      └────────────┘      └──────────┘
     │                │                   │                   │
     │ Connect Wallet │                   │                   │
     │───────────────▶│                   │                   │
     │                │                   │                   │
     │ Select Plan    │                   │                   │
     │───────────────▶│                   │                   │
     │                │                   │                   │
     │                │ Create Payment    │                   │
     │                │──────────────────▶│                   │
     │                │◀──────────────────│                   │
     │                │ Receiver Address  │                   │
     │                │                   │                   │
     │ Select Network │                   │                   │
     │───────────────▶│                   │                   │
     │                │                   │                   │
     │                │ Send USDC         │                   │
     │                │──────────────────────────────────────▶│
     │                │                   │                   │
     │ Approve TX     │                   │                   │
     │───────────────▶│                   │                   │
     │                │                   │                   │
     │                │◀──────────────────────────────────────│
     │                │ TX Hash           │                   │
     │                │                   │                   │
     │                │ Verify Payment    │                   │
     │                │──────────────────▶│                   │
     │                │                   │                   │
     │                │                   │ Check TX On-Chain │
     │                │                   │──────────────────▶│
     │                │                   │◀──────────────────│
     │                │                   │ TX Details        │
     │                │                   │                   │
     │                │◀──────────────────│                   │
     │◀───────────────│ Success           │                   │
     │ Subscription   │                   │                   │
     │ Activated      │                   │                   │
```

## Security Features

### 1. Transaction Verification
- Every payment is verified on-chain before activation
- Checks transaction status (must be successful)
- Verifies correct receiver address
- Validates payment amount (1% tolerance for gas)
- Confirms USDC token transfer event

### 2. Address Validation
- All wallet addresses validated using ethers.js
- Only valid Ethereum addresses accepted

### 3. Chain Support
- Only whitelisted chains supported
- USDC contract addresses hardcoded per chain

### 4. Amount Verification
- Backend verifies exact amount with 1% tolerance
- Prevents underpayment attacks

## Testing

### 1. Local Testing with Testnets

Use testnet USDC for testing:

**Get Testnet USDC:**
- Sepolia: [Aave Faucet](https://staging.aave.com/faucet/)
- Mumbai: [Aave Faucet](https://staging.aave.com/faucet/)
- Arbitrum Sepolia: [Arbitrum Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
- Base Sepolia: [Base Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)

**Test Flow:**
1. Connect MetaMask to testnet
2. Get testnet USDC from faucet
3. Go to billing page
4. Connect wallet
5. Create payment
6. Send USDC on testnet
7. Verify payment activates subscription

### 2. API Testing

```bash
# Create payment
curl -X POST http://localhost:3001/api/v1/subscriptions/SUB_ID/payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 29,
    "walletAddress": "0xYourWallet",
    "metadata": {"plan": "STARTER"}
  }'

# Verify payment
curl -X POST http://localhost:3001/api/v1/subscriptions/payment/PAYMENT_ID/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionHash": "0xTxHash",
    "chainId": 11155111
  }'
```

## Troubleshooting

### Common Issues

#### 1. "Transaction not found"
- **Cause**: Transaction not yet confirmed
- **Solution**: Wait a few blocks and retry verification

#### 2. "Unsupported chain"
- **Cause**: RPC URL not configured
- **Solution**: Add RPC URL to `.env` file

#### 3. "Amount mismatch"
- **Cause**: Wrong amount sent or gas included
- **Solution**: Send exact USDC amount (±1% tolerance)

#### 4. "Payment sent to wrong address"
- **Cause**: USDC sent to wrong receiver
- **Solution**: Verify receiver address before sending

#### 5. "MetaMask not detected"
- **Cause**: No Web3 wallet installed
- **Solution**: Install MetaMask browser extension

### Logs

Check backend logs for payment verification:

```bash
cd backend
tail -f logs/app.log | grep "Web3Payment"
```

## Migration from Stripe

If you have existing Stripe subscriptions:

1. **Data Migration**: Export Stripe subscription data
2. **User Notification**: Inform users about payment method change
3. **Grace Period**: Allow time for users to switch
4. **Cancel Stripe**: Cancel all Stripe subscriptions
5. **Archive Data**: Keep Stripe payment history for records

## Gas Optimization

### Recommended Networks by Gas Cost

1. **Lowest Gas**: Polygon (< $0.01 per transaction)
2. **Low Gas**: Base (< $0.05 per transaction)
3. **Medium Gas**: Arbitrum (< $0.10 per transaction)
4. **Higher Gas**: Ethereum ($2-20 depending on congestion)

**Recommendation**: Guide users to Polygon or Base for lowest fees.

## Monitoring

### Key Metrics to Monitor

- Payment success rate
- Average transaction confirmation time
- Failed payment reasons
- Network distribution (which chains users prefer)
- USDC balance on receiver wallet

### Recommended Tools

- **Block Explorer**: Monitor receiver wallet on Etherscan/Polygonscan
- **Alerts**: Set up alerts for low USDC balance
- **Analytics**: Track payment conversion rates

## Support

### For Users

**Wallet Issues:**
- Install MetaMask: https://metamask.io/
- Get testnet USDC: Use faucets listed above
- Network switching: MetaMask will prompt automatically

**Payment Issues:**
- Transaction pending: Check block explorer
- Wrong network: Switch network in MetaMask
- Insufficient USDC: Buy USDC on exchanges

### For Developers

**Backend Issues:**
- Check RPC provider status
- Verify receiver address configuration
- Review transaction logs

**Frontend Issues:**
- Check Web3 wallet connection
- Verify ethers.js version (v6+)
- Test on different networks

## Production Checklist

Before going to production:

- [ ] Update `WEB3_RECEIVER_ADDRESS` with production wallet
- [ ] Configure all mainnet RPC URLs
- [ ] Test on all supported mainnets
- [ ] Set up receiver wallet monitoring
- [ ] Enable transaction logging
- [ ] Document refund process
- [ ] Train support team on Web3 payments
- [ ] Create user guide for crypto payments
- [ ] Set up backup RPC providers
- [ ] Test payment flow end-to-end

## Refund Process

To refund a payment:

1. Get user's wallet address from payment record
2. Send USDC from receiver wallet to user's address
3. Update payment status to `REFUNDED` in database
4. Update subscription status accordingly

```typescript
// Manual refund (requires private key management)
// Implement with secure key management system
```

## Resources

- **Ethers.js Documentation**: https://docs.ethers.org/
- **USDC Information**: https://www.circle.com/en/usdc
- **MetaMask Docs**: https://docs.metamask.io/
- **Alchemy RPC**: https://www.alchemy.com/
- **Block Explorers**:
  - Ethereum: https://etherscan.io/
  - Polygon: https://polygonscan.com/
  - Arbitrum: https://arbiscan.io/
  - Base: https://basescan.org/

## License

This implementation is part of the AI Code Reviewer project.
