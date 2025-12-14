# Quick Reference: Wagmi v3 Usage

## Common Patterns

### 1. Connect Wallet

```tsx
import { useConnect } from 'wagmi';

function ConnectButton() {
  const { connect, connectors } = useConnect();

  return (
    <>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
        >
          Connect {connector.name}
        </button>
      ))}
    </>
  );
}
```

### 2. Get Account Info

```tsx
import { useAccount } from 'wagmi';

function WalletInfo() {
  const { address, isConnected, chainId } = useAccount();

  if (!isConnected) return <div>Not connected</div>;

  return (
    <div>
      <p>Address: {address}</p>
      <p>Chain ID: {chainId}</p>
    </div>
  );
}
```

### 3. Switch Network

```tsx
import { useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';

function NetworkSwitcher() {
  const { switchChain } = useSwitchChain();

  return (
    <button onClick={() => switchChain({ chainId: sepolia.id })}>
      Switch to Sepolia
    </button>
  );
}
```

### 4. Sign Message

```tsx
import { useSignMessage } from 'wagmi';

function SignMessage() {
  const { signMessageAsync } = useSignMessage();

  const handleSign = async () => {
    const signature = await signMessageAsync({
      message: 'Hello from AI Code Reviewer',
    });
    console.log('Signature:', signature);
  };

  return <button onClick={handleSign}>Sign Message</button>;
}
```

### 5. Write to Contract

```tsx
import { useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';

function TransferUSDT() {
  const { writeContractAsync } = useWriteContract();

  const handleTransfer = async () => {
    const hash = await writeContractAsync({
      address: '0x...',
      abi: USDT_ABI,
      functionName: 'transfer',
      args: [recipientAddress, parseUnits('10', 6)], // 10 USDT
    });
    console.log('Transaction hash:', hash);
  };

  return <button onClick={handleTransfer}>Send USDT</button>;
}
```

### 6. Read from Contract

```tsx
import { useReadContract } from 'wagmi';

function USDTBalance({ address }: { address: string }) {
  const { data: balance } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  return <div>Balance: {balance?.toString()}</div>;
}
```

### 7. Disconnect Wallet

```tsx
import { useDisconnect } from 'wagmi';

function DisconnectButton() {
  const { disconnect } = useDisconnect();

  return <button onClick={() => disconnect()}>Disconnect</button>;
}
```

## Available Connectors

### Injected (MetaMask, Brave, etc.)
- Automatically detects browser wallet extensions
- Works with MetaMask, Brave Wallet, Trust Wallet, etc.

### WalletConnect
- Shows QR code for mobile wallet connection
- Supports 300+ mobile wallets
- Requires WalletConnect Project ID

### Coinbase Wallet
- Native Coinbase Wallet integration
- Works on desktop and mobile
- Better UX for Coinbase users

## Utility Functions

### Format Address
```tsx
const formatAddress = (addr: string) =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;
```

### Parse/Format Units
```tsx
import { parseUnits, formatUnits } from 'viem';

// Convert to wei (18 decimals)
const amount = parseUnits('10', 18); // 10 ETH

// Convert to USDT units (6 decimals)
const usdtAmount = parseUnits('100', 6); // 100 USDT

// Format back to readable
const readable = formatUnits(amount, 18); // "10"
```

### Check Network
```tsx
import { useAccount } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const { chainId } = useAccount();
const isCorrectNetwork = chainId === sepolia.id;
```

## Type Safety

### Define ABI with `as const`
```tsx
const USDT_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
```

### Type Address
```tsx
const address = '0x...' as `0x${string}`;
```

## Error Handling

```tsx
import { useWriteContract } from 'wagmi';

function SafeTransfer() {
  const { writeContractAsync } = useWriteContract();

  const handleTransfer = async () => {
    try {
      const hash = await writeContractAsync({
        address: USDT_CONTRACT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'transfer',
        args: [recipientAddress, amount],
      });
      console.log('Success:', hash);
    } catch (error: any) {
      if (error.message.includes('User rejected')) {
        console.log('User cancelled transaction');
      } else {
        console.error('Transaction failed:', error);
      }
    }
  };

  return <button onClick={handleTransfer}>Transfer</button>;
}
```

## Best Practices

1. **Always check connection status** before showing wallet-dependent UI
2. **Handle network switching** gracefully with user prompts
3. **Use try-catch** for all async wallet operations
4. **Show loading states** during transactions
5. **Validate user inputs** before sending transactions
6. **Use TypeScript** for better type safety
7. **Keep ABIs minimal** - only include functions you need
8. **Cache queries appropriately** using React Query options

## Common Issues

### "Chain not configured"
- Add the chain to your Wagmi config
- Or prompt user to add it to their wallet

### "User rejected request"
- User cancelled in wallet - handle gracefully
- Don't show error, just inform user

### "Insufficient funds"
- Check user balance before transaction
- Show clear error message

### Transaction Pending Too Long
- Sepolia can be slow sometimes
- Show loading state with "This may take a minute"
- Consider adding manual check/refresh option

## Testing on Sepolia

1. Get test ETH: https://sepoliafaucet.com
2. Add Sepolia to MetaMask if not already there
3. Check transactions: https://sepolia.etherscan.io
4. Use small amounts for testing

## Resources

- [Wagmi Docs](https://wagmi.sh)
- [Viem Docs](https://viem.sh)
- [React Query Docs](https://tanstack.com/query)
- [WalletConnect Cloud](https://cloud.walletconnect.com)
