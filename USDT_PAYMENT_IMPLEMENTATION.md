# USDT Payment Integration on Polygon Amoy Testnet

## Overview

This document describes the implementation of USDT payment system for subscription management using Polygon Amoy Testnet with signature-based verification.

## Architecture

### Payment Flow

1. **User initiates payment** → Backend creates payment request with salt
2. **User signs message** → Frontend signs with wallet, backend verifies signature
3. **User sends USDT** → Frontend sends USDT to receiver address via wagmi/viem
4. **Admin verifies transaction** → Backend crawls blockchain and confirms payment

### Components

#### Backend (NestJS)

- `web3-payment.service.ts` - Handles Web3 interactions, signature verification, transaction verification
- `subscription.service.ts` - Manages subscriptions and payment lifecycle
- `subscription.controller.ts` - API endpoints for payment flow

#### Frontend (Next.js + Wagmi)

- `wagmi.config.ts` - Wagmi configuration for Polygon Amoy
- `billing/page.tsx` - Payment UI with wallet connection and USDT transfer

## Setup Instructions

### Backend Configuration

1. **Install dependencies**:
```bash
cd backend
pnpm install ethers
```

2. **Environment variables** (`.env`):
```env
# Polygon Amoy RPC URL
AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Receiver wallet address (where USDT will be sent)
WEB3_RECEIVER_ADDRESS=0xYourReceiverAddress

# Admin private key (for signature verification)
WEB3_ADMIN_PRIVATE_KEY=0xYourAdminPrivateKey

# USDT Contract on Amoy (TODO: Replace with actual USDT contract)
# You need to deploy or find USDT contract on Amoy testnet
```

3. **Update USDT contract address**:
   - Edit `backend/src/modules/subscription/web3-payment.service.ts`
   - Replace `const USDT_CONTRACT_ADDRESS = '0x...'` with actual USDT contract on Amoy

### Frontend Configuration

1. **Install dependencies**:
```bash
cd frontend
pnpm install wagmi viem @tanstack/react-query
```

2. **Update USDT contract address**:
   - Edit `frontend/src/lib/wagmi.config.ts`
   - Replace `export const USDT_CONTRACT_ADDRESS = '0x...'` with actual USDT contract

3. **Environment variables** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

### 1. Create Payment Request
```
POST /subscriptions/:subscriptionId/payment/request
```

**Request Body:**
```json
{
  "amount": 29
}
```

**Response:**
```json
{
  "paymentId": "uuid",
  "salt": "random-hex-string",
  "message": "Payment Request\nAmount: 29 USDT\n...",
  "amount": 29,
  "receiverAddress": "0x...",
  "chainInfo": {
    "chainId": 80002,
    "name": "Polygon Amoy Testnet",
    "usdtAddress": "0x..."
  },
  "expiresAt": 1234567890
}
```

### 2. Submit Signature
```
POST /subscriptions/payment/:paymentId/signature
```

**Request Body:**
```json
{
  "signature": "0x...",
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signature verified. Please send USDT to complete payment.",
  "paymentId": "uuid"
}
```

### 3. Verify Transaction (Admin)
```
POST /subscriptions/payment/:paymentId/verify
```

**Request Body:**
```json
{
  "transactionHash": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "payment": { ... },
  "subscription": { ... }
}
```

## Frontend Usage

### Connect Wallet
```tsx
import { useAccount, useConnect } from "wagmi";

const { address, isConnected } = useAccount();
const { connect, connectors } = useConnect();

// Connect wallet
const handleConnect = () => {
  const injectedConnector = connectors.find((c) => c.id === "injected");
  if (injectedConnector) {
    connect({ connector: injectedConnector });
  }
};
```

### Sign Message
```tsx
import { useSignMessage } from "wagmi";

const { signMessageAsync } = useSignMessage();

// Sign payment message
const signature = await signMessageAsync({
  message: paymentRequest.message,
});
```

### Send USDT
```tsx
import { useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { USDT_CONTRACT_ADDRESS, USDT_ABI } from "@/lib/wagmi.config";

const { writeContractAsync } = useWriteContract();

// Send USDT
const hash = await writeContractAsync({
  address: USDT_CONTRACT_ADDRESS,
  abi: USDT_ABI,
  functionName: "transfer",
  args: [receiverAddress, parseUnits(amount.toString(), 6)],
});
```

## Security Features

1. **Salt-based verification** - Prevents replay attacks
2. **Signature verification** - Ensures user owns the wallet
3. **On-chain verification** - Admin verifies actual blockchain transaction
4. **Expiration time** - Payment requests expire after 30 minutes
5. **Amount validation** - Verifies exact amount with 1% tolerance

## Testing

### Get Amoy Testnet Tokens

1. **Get MATIC (for gas)**:
   - Visit [Polygon Faucet](https://faucet.polygon.technology/)
   - Select "Amoy Testnet"
   - Enter your wallet address

2. **Get USDT (testnet)**:
   - You need to find or deploy a USDT contract on Amoy
   - Or use a testnet USDT faucet if available

### Test Payment Flow

1. Connect wallet on `/dashboard/billing`
2. Click "Upgrade with USDT"
3. Sign the message in your wallet
4. Send USDT transaction
5. Wait for admin verification (automatic)

## Admin Dashboard (Future Enhancement)

Create an admin endpoint to manually verify pending payments:

```
GET /admin/payments/pending
POST /admin/payments/:paymentId/verify
```

This can be used for manual verification if automatic verification fails.

## Notes

- **Amoy Testnet Chain ID**: 80002
- **USDT Decimals**: 6
- **Gas Token**: MATIC
- **Block Explorer**: https://amoy.polygonscan.com

## Troubleshooting

### Transaction not found
- Wait a few seconds for transaction to be mined
- Check if transaction was successful on block explorer

### Signature verification failed
- Ensure you're signing with the correct wallet
- Check if payment request hasn't expired

### Wrong network
- Wagmi will automatically prompt to switch to Amoy
- Manually add Amoy network to MetaMask if needed

## Future Improvements

1. Add admin dashboard for manual payment verification
2. Implement webhook for automatic payment detection
3. Add support for multiple tokens (USDC, DAI, etc.)
4. Implement refund mechanism
5. Add payment notifications via email/Discord
