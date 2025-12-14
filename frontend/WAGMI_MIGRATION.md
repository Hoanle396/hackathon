# Wagmi Migration to Latest Version - Sepolia Testnet

This document outlines the migration from Polygon Amoy to Sepolia testnet and the update to the latest Wagmi patterns.

## Changes Made

### 1. Network Migration
- **From**: Polygon Amoy Testnet
- **To**: Sepolia Testnet (Ethereum)

### 2. Wagmi Configuration Updates

#### Updated Connectors
The configuration now includes multiple wallet connectors:
- **MetaMask/Injected Wallet** - Browser extension wallets
- **WalletConnect** - Mobile wallet connection via QR code
- **Coinbase Wallet** - Coinbase Wallet connection

#### Configuration File (`src/lib/wagmi.config.ts`)
```typescript
import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({ projectId: '...', showQrModal: true }),
    coinbaseWallet({ appName: 'AI Code Reviewer' }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});
```

### 3. Environment Variables

Add to your `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# WalletConnect Configuration
# Get your project ID from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

### 4. Smart Contract Updates

#### USDT Contract Address
- **Old (Amoy)**: `0x741A2E7604D850Af2bDf20B27616BA33Fad71E75`
- **New (Sepolia)**: `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`

⚠️ **Note**: The Sepolia USDT address is a placeholder. You'll need to:
1. Deploy your own ERC20 token to Sepolia, OR
2. Use an existing USDT-like token on Sepolia

### 5. Block Explorer URLs
- **Old**: `https://amoy.polygonscan.com/tx/{hash}`
- **New**: `https://sepolia.etherscan.io/tx/{hash}`

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
pnpm install
```

### 2. Get WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy your Project ID
4. Add it to `.env.local`

### 3. Update Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 4. Test the Connection

```bash
pnpm dev
```

Navigate to the billing page and try connecting with different wallets:
- MetaMask (browser extension)
- WalletConnect (mobile wallets)
- Coinbase Wallet

## Testing on Sepolia

### Get Sepolia ETH
1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your wallet address
3. Request test ETH

### Deploy Test USDT Token (Optional)

If you need a test USDT token:

```bash
cd ../contracts
pnpm install
pnpm run deploy:sepolia
```

Update the `USDT_CONTRACT_ADDRESS` in `wagmi.config.ts` with your deployed token address.

## Wagmi Hooks Used (Latest Patterns)

The following hooks are already using the latest Wagmi v2/v3 patterns:

- ✅ `useAccount()` - Get connected wallet info
- ✅ `useConnect()` - Connect wallet
- ✅ `useDisconnect()` - Disconnect wallet
- ✅ `useSignMessage()` - Sign messages
- ✅ `useSwitchChain()` - Switch networks
- ✅ `useWriteContract()` - Write to contracts

### Deprecated Hooks Removed
- ❌ `usePrepareContractWrite` - No longer needed
- ❌ `useContractWrite` - Replaced with `useWriteContract`
- ❌ `useWaitForTransaction` - Built into `useWriteContract`

## Important Notes

### Wagmi v2/v3 Breaking Changes

1. **Transaction Waiting**: No need for separate `useWaitForTransaction` hook
2. **Contract Writing**: `writeContractAsync` returns transaction hash directly
3. **Type Safety**: Better TypeScript support with `as const` ABI definitions
4. **SSR Support**: Added `ssr: true` for Next.js compatibility

### Multi-Connector Support

Users can now choose from:
1. **Browser Wallets** (MetaMask, Brave, etc.)
2. **WalletConnect** - Works with 300+ mobile wallets
3. **Coinbase Wallet** - Native Coinbase integration

### Network Switching

The app automatically prompts users to switch to Sepolia if they're on a different network.

## Troubleshooting

### "Chain not configured" Error
- Ensure Sepolia is in your MetaMask networks
- Add Sepolia manually if needed

### WalletConnect Not Working
- Check your `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Ensure it's a valid WalletConnect v2 project ID

### Transaction Failures
- Ensure you have enough Sepolia ETH for gas
- Check the USDT contract address is correct
- Verify the contract has the correct ABI

## Backend Updates Needed

The backend should also be updated to:
1. Listen for transactions on Sepolia (chain ID: 11155111)
2. Update the USDT contract address
3. Use Sepolia RPC endpoints
4. Update block explorer links

## Resources

- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [WalletConnect Cloud](https://cloud.walletconnect.com)
- [Sepolia Testnet Info](https://sepolia.dev/)
- [Sepolia Faucet](https://sepoliafaucet.com/)

## Version Information

- Wagmi: v3.1.0
- Viem: v2.42.0
- @tanstack/react-query: v5.90.12
- @coinbase/wallet-sdk: v4.3.7
