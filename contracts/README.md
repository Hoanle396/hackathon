# ERC20 Token Smart Contract Project

A complete Hardhat-based project for deploying custom ERC20 tokens with advanced features including minting, burning, and pausing capabilities.

## Features

- ✅ **ERC20 Standard**: Full implementation of the ERC20 token standard
- 🔥 **Burnable**: Token holders can burn their tokens
- ⏸️ **Pausable**: Owner can pause/unpause all token transfers
- 👤 **Ownable**: Owner-only access to mint, pause, and unpause functions
- 🧪 **Fully Tested**: Comprehensive test suite included
- 🚀 **Easy Deployment**: Ready-to-use deployment scripts

## Project Structure

```
contracts/
├── contracts/
│   └── MyToken.sol          # ERC20 token contract
├── scripts/
│   └── deploy.ts            # Deployment script
├── test/
│   └── MyToken.test.ts      # Test suite
├── hardhat.config.ts        # Hardhat configuration
├── package.json
└── .env.example
```

## Prerequisites

- Node.js v16 or higher
- npm or pnpm

## Installation

1. Install dependencies:

```bash
cd contracts
npm install
# or
pnpm install
```

2. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

3. Fill in your environment variables in `.env`:
   - `PRIVATE_KEY`: Your wallet private key (for deployment)
   - `SEPOLIA_RPC_URL`: RPC URL for Sepolia testnet
   - `MAINNET_RPC_URL`: RPC URL for Ethereum mainnet
   - `ETHERSCAN_API_KEY`: API key for contract verification

## Customize Your Token

Edit `contracts/MyToken.sol` or update the deployment script `scripts/deploy.ts` to customize:

- Token name
- Token symbol
- Initial supply
- Decimals (default is 18)

## Usage

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy

**Local Network:**

```bash
# Start a local Hardhat node in one terminal
npx hardhat node

# Deploy in another terminal
npm run deploy:localhost
```

**Sepolia Testnet:**

```bash
npm run deploy:sepolia
```

**Ethereum Mainnet:**

```bash
npm run deploy:mainnet
```

### Verify Contract on Etherscan

After deployment, verify your contract:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "My Token" "MTK" 1000000
```

Replace `<CONTRACT_ADDRESS>` with your deployed contract address and adjust the constructor arguments as needed.

## Token Functions

### Public Functions

- `transfer(address to, uint256 amount)`: Transfer tokens to another address
- `approve(address spender, uint256 amount)`: Approve spender to use tokens
- `transferFrom(address from, address to, uint256 amount)`: Transfer tokens on behalf of another address
- `burn(uint256 amount)`: Burn your own tokens

### Owner-Only Functions

- `mint(address to, uint256 amount)`: Mint new tokens
- `pause()`: Pause all token transfers
- `unpause()`: Unpause token transfers

## Security Considerations

- **Never commit your `.env` file** - it contains your private key
- **Test thoroughly** before deploying to mainnet
- **Audit your contract** if dealing with significant value
- **Use a hardware wallet** for mainnet deployments
- **Consider using a multi-sig wallet** as the contract owner

## Built With

- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/) - Secure smart contract library
- [ethers.js](https://docs.ethers.org/) - Ethereum library

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
