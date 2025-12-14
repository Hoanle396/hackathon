# USDT Payment Setup - Quick Guide

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies (if not already)
pnpm install

# Copy and configure environment variables
cp .env.example .env
```

Edit `.env` and configure:
```env
# Your receiver wallet address (where USDT will be sent)
WEB3_RECEIVER_ADDRESS=0xYourReceiverAddress

# Admin wallet private key (for verification)
WEB3_ADMIN_PRIVATE_KEY=0xYourPrivateKey

# Amoy RPC (default works, or use Alchemy/Infura)
AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# USDT Contract on Amoy
USDT_CONTRACT_AMOY=0xYourUSDTContractOnAmoy
```

**Important**: The system will automatically start listening to USDT Transfer events when the app starts!

### 2. Frontend Setup

```bash
cd frontend

# Install new dependencies
pnpm install wagmi viem @tanstack/react-query

# Already configured!
```

**Important**: Update USDT contract address in `frontend/src/lib/wagmi.config.ts`:
```typescript
export const USDT_CONTRACT_ADDRESS = '0xYourUSDTContractOnAmoy' as `0x${string}`;
```

### 3. Get Testnet Tokens

1. **Get MATIC (for gas)**: https://faucet.polygon.technology/ → Select "Amoy Testnet"
2. **Get USDT**: Deploy your own test USDT contract or use existing testnet USDT

### 4. Start Development

```bash
# Terminal 1 - Backend
cd backend
pnpm run start:dev

# Terminal 2 - Frontend  
cd frontend
pnpm run dev
```

## 📝 Payment Flow

1. User connects wallet (MetaMask)
2. User clicks "Upgrade with USDT"
3. User signs message (free, no gas)
4. User sends USDT transaction (requires gas)
5. **Backend automatically listens to Transfer event** 🎧
6. **Backend auto-verifies transaction on-chain** ✅
7. Subscription activated automatically! 🎉

## 🎧 Automatic Payment Verification

The system uses **real-time event listening**:

- ✅ **Event Listener**: Listens to USDT Transfer events in real-time
- ✅ **Auto-starts**: Starts automatically when app launches
- ✅ **Periodic Crawler**: Checks every 2 minutes for missed transactions
- ✅ **No Manual Work**: Completely automatic verification

### How it Works

```
App Starts → Event Listener Activates
                    ↓
User Sends USDT → Transfer Event Emitted
                    ↓
Listener Catches Event → Verifies Transaction
                    ↓
              Subscription Activated
```

## 🔗 API Endpoints

### Payment Flow
- `POST /subscriptions/:id/payment/request` - Create payment with salt
- `POST /subscriptions/payment/:id/signature` - Submit signature
- `POST /subscriptions/payment/:id/verify` - Manual verify (optional, auto-verified)

### Monitoring
- `GET /subscriptions/payment/listener/status` - Check listener status
- `POST /subscriptions/payment/listener/crawl` - Manual crawl (admin)

## 🛠 Key Technologies

- **Backend**: NestJS + ethers.js
- **Frontend**: Next.js + Wagmi + Viem
- **Blockchain**: Polygon Amoy Testnet (Chain ID: 80002)
- **Token**: USDT (6 decimals)

## 📚 Full Documentation

See `USDT_PAYMENT_IMPLEMENTATION.md` for complete details.

## ⚠️ Important Notes

1. **Replace USDT contract addresses** in both backend and frontend
2. **Keep private keys secure** - never commit to git
3. **Amoy is testnet** - for production, switch to Polygon mainnet
4. **Test thoroughly** before going live

## 🐛 Troubleshooting

- **Transaction not found**: Wait a few seconds for block confirmation
- **Signature failed**: Check wallet is on correct network
- **Wrong network**: Wagmi auto-prompts to switch to Amoy

## 📦 What Changed

### Removed:
- Multi-chain USDC support
- Multiple RPC providers
- Complex chain switching logic

### Added:
- Single chain (Amoy) USDT payment
- Salt-based signature verification
- Wagmi/Viem wallet management
- Clean 3-step payment flow

### Modified:
- `subscription.controller.ts` - New endpoints + listener status
- `subscription.service.ts` - New payment methods
- `subscription.module.ts` - Added PaymentListenerService
- `web3-payment.service.ts` - Simplified for single chain
- `billing/page.tsx` - Complete rewrite with Wagmi + auto-check

### Added:
- `payment-listener.service.ts` - **Automatic event listener & crawler** 🎧
- Auto-starts when app launches
- Listens to USDT Transfer events in real-time
- Periodic crawler every 2 minutes for missed transactions

---

**Ready to test!** 🎉

Navigate to http://localhost:3000/dashboard/billing and try the payment flow.

**No manual verification needed** - the system automatically detects and verifies payments!
