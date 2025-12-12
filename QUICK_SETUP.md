# Quick Setup Guide - USDC Payments

## 🚀 Quick Start (5 minutes)

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install ethers
```

2. **Configure Environment**
```bash
cp .env.example .env
```

Edit `.env` and add:
```env
# Your wallet address to receive payments
WEB3_RECEIVER_ADDRESS=0xYourWalletAddress

# Get free RPC from Alchemy.com
ETHEREUM_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR-KEY
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR-KEY
```

3. **Run Database Migration**
```bash
npm run typeorm migration:generate -- -n RemoveStripeAddWeb3
npm run typeorm migration:run
```

4. **Start Backend**
```bash
npm run start:dev
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install ethers
```

2. **Start Frontend**
```bash
npm run dev
```

### Testing

1. **Install MetaMask**: https://metamask.io/
2. **Get Testnet USDC**: https://staging.aave.com/faucet/ (Sepolia)
3. **Test Payment**:
   - Go to http://localhost:3000/dashboard/billing
   - Click "Connect Wallet"
   - Select a plan
   - Send USDC payment
   - Verify subscription activates

## 🔑 Key Changes

### What Was Removed
- ❌ Stripe Payment Intent ID
- ❌ Stripe Charge ID
- ❌ Stripe Customer ID
- ❌ Stripe Subscription ID
- ❌ Seepay integration

### What Was Added
- ✅ Web3 wallet connection
- ✅ USDC payment support
- ✅ Multi-chain support (Ethereum, Polygon, Arbitrum, Base)
- ✅ On-chain transaction verification
- ✅ Block explorer links
- ✅ Real-time payment status

## 🌐 Supported Networks

**Testnets (for development):**
- Ethereum Sepolia
- Polygon Mumbai
- Arbitrum Sepolia
- Base Sepolia

**Mainnets (for production):**
- Ethereum
- Polygon
- Arbitrum
- Base

## 📝 New API Endpoints

```
POST /api/v1/subscriptions/:id/payment
- Creates payment intent
- Returns receiver address and supported chains

POST /api/v1/subscriptions/payment/:paymentId/verify
- Verifies blockchain transaction
- Activates subscription
```

## 💡 Important Notes

1. **Gas Fees**: Users pay gas fees in native tokens (ETH, MATIC, etc.)
2. **USDC Amount**: Must match subscription price exactly (±1% tolerance)
3. **Confirmation Time**: Varies by network (1-30 seconds)
4. **Receiver Address**: Must be set in `.env` before testing

## 🎯 Production Deployment

Before production:
1. Use mainnet RPC URLs
2. Test on all mainnets
3. Monitor receiver wallet
4. Set up alerts for payments
5. Create user documentation

## 📚 Documentation

- Full Guide: `WEB3_USDC_INTEGRATION.md`
- API Docs: Available at `/api-docs` endpoint
- Frontend Components: Check `billing/page.tsx`

## 🆘 Support

**Common Issues:**
- MetaMask not connecting? Refresh page
- Wrong network? MetaMask will prompt to switch
- Transaction pending? Check block explorer
- Insufficient funds? Get testnet USDC from faucet

**Resources:**
- Alchemy (RPC): https://www.alchemy.com/
- Testnet Faucet: https://staging.aave.com/faucet/
- MetaMask Guide: https://docs.metamask.io/

## ✅ Checklist

- [ ] Install ethers.js in backend
- [ ] Install ethers.js in frontend
- [ ] Configure WEB3_RECEIVER_ADDRESS
- [ ] Add RPC URLs to .env
- [ ] Run database migrations
- [ ] Test wallet connection
- [ ] Test payment flow on testnet
- [ ] Verify subscription activation
- [ ] Check payment history
- [ ] Review block explorer links
