# Keyvault Frontend

A React-based web interface for the Keyvault blockchain password manager. This frontend communicates with both the Keyvault smart contract and the browser extension to provide a seamless user experience for managing encrypted credentials on-chain.

## Architecture

The frontend serves as the bridge between users and the blockchain, featuring:

- **Browser Extension Communication**: Receives encrypted data from the browser extension via postMessage API
- **Smart Contract Integration**: Interacts with the Keyvault smart contract using Wagmi and Viem
- **Wallet Support**: Currently supports MetaMask wallet connections (additional wallets can be added by modifying the `allowedWallets` set in `src/Connect.tsx`)
- **Dual Network Support**: Supports both localhost (Hardhat) for development and Astar mainnet for production
- **Real-time Updates**: Features toast notifications, error handling, and retry mechanisms

## Network Configuration

Network switching is controlled by the `VITE_NETWORK` environment variable:

- **Development**: `VITE_NETWORK=localhost` (default for `bun run dev`)
- **Production**: `VITE_NETWORK=astar` (default for `bun run build`)

The network configuration is managed in `src/config.ts` and automatically selects the appropriate chain and contract address.

## Development Setup

### Prerequisites

1. **Smart Contract**: Ensure the Keyvault contract is deployed and running
2. **Browser Extension**: Install and configure the Keyvault browser extension
3. **Node.js**: Version 18 or higher recommended

### Installation

```bash
bun install
```

### Development Scripts

```bash
# Start development server (localhost network)
bun run dev

# Build for production (Astar network)  
bun run build

# Run linting
bun run lint

# Preview production build
bun run preview
```

## Local Development Workflow

1. **Start the local blockchain network**:
   ```bash
   cd ../contract
   bun run local:node
   ```

2. **Deploy the Keyvault contract**:
   ```bash
   cd ../contract
   bun run local:deploy
   ```
   
   Note the deployed address (typically `0x5FbDB2315678afecb367f032d93F642f64180aa3`)

3. **Start the frontend**:
   ```bash
   bun run dev
   ```

4. **Load the browser extension** (see `../browser-extension/README.md`)

### Troubleshooting

- **Contract Address Mismatch**: If the deployed contract address differs from the default, update `src/localKeyvaultAddress.ts`
- **Extension Communication Issues**: Ensure the browser extension is loaded and the frontend is accessed via the correct origin
- **Wallet Connection Problems**: Verify MetaMask is installed and connected to the correct network
- **Network Switching**: Use the "Switch network" button in the header when connected to the wrong chain

## Features

### Main Application (`/`)
- Receives encrypted credential data from browser extension
- Validates data integrity (address and chain ID matching)
- Submits encrypted entries to the smart contract
- Provides real-time feedback and error handling

### Public Key Management (`/updatePublicKey`)
- Allows users to publish their public keys on-chain
- Enables others to encrypt data for the user
- Similar validation and submission flow as main app

### Communication Protocol

The frontend listens for messages from the browser extension with the following structure:

```typescript
type Message = {
  type: "FROM_EXTENSION";
  channelName: string;
  data: {
    address: string;      // User's wallet address
    chainId: number;      // Target blockchain network
    encrypted: {          // AES-GCM encrypted data
      iv: string;         // Initialization vector
      ciphertext: string; // Encrypted credential data
    };
    numEntries: number;   // Current number of entries
    overwrite?: boolean;  // Whether to overwrite existing data
  };
};
```

## Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Wagmi** for Web3 wallet integration
- **Viem** for Ethereum interactions
- **Tailwind CSS** with Radix UI components for styling
- **React Query** for server state management
- **React Router** for client-side routing

## Security Considerations

- All encryption/decryption happens client-side
- Smart contract interactions require user wallet approval
- Message validation ensures data integrity
- Network validation prevents cross-chain attacks
- No sensitive data is stored in the frontend application

## Deployment

The frontend is configured for deployment on Vercel (see `vercel.json`). For production deployment:

1. Ensure `VITE_NETWORK=astar` in build environment
2. Verify the Astar contract address in `src/config.ts`
3. Build and deploy: `bun run build`

## Contributing

When adding new wallet support:
1. Update the `allowedWallets` set in `src/Connect.tsx`
2. Test wallet connection and transaction signing
3. Verify network switching functionality

For additional networks:
1. Add network configuration to `src/config.ts`
2. Update the `NETWORK` type and `setChainConfig` function
3. Deploy contract to the new network and update addresses
