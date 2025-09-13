# Keyvault

A blockchain-based password manager that provides secure, decentralized storage for encrypted credentials using smart contracts and client-side encryption.

## System Architecture

Keyvault consists of three main components that work together to provide a complete password management solution:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Browser         │    │ Frontend        │    │ Smart Contract  │
│ Extension       │───▶│ (React App)     │───▶│ (Blockchain)    │
│                 │    │                 │    │                 │
│ • Encrypt/      │    │ • Wallet        │    │ • Store         │
│   Decrypt       │    │   Integration   │    │   Encrypted     │
│ • UI/UX         │    │ • Transaction   │    │   Data          │
│ • Local Storage │    │   Management    │    │ • Public Keys   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Interactions

1. **Browser Extension** → **Frontend**: Sends encrypted credential data via postMessage API
2. **Frontend** → **Smart Contract**: Submits encrypted data to blockchain via wallet transactions
3. **Smart Contract**: Stores encrypted blobs and public keys on-chain with append-only structure

## Deployments

- **Astar Mainnet**: [0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B](https://astar.blockscout.com/address/0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B)
- **Local Development**: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (default Hardhat address)

## Quick Start

### Prerequisites
- Node.js 18+ and bun
- [Foundry](https://book.getfoundry.sh/getting-started/installation) for local blockchain
- MetaMask or compatible Web3 wallet
- Firefox Developer Edition (for Firefox users) or Chromium-based browser (Chrome, Brave, etc.)

### Local Development Setup

1. **Clone and setup**:
   ```bash
   git clone https://github.com/lousydropout/keyvault.git
   cd keyvault
   ```

2. **Start local blockchain** (Terminal 1):
   ```bash
   cd contract
   bun install
   bun run local:node
   ```

3. **Deploy smart contract** (Terminal 2):
   ```bash
   cd contract
   bun run local:deploy
   # Note the deployed address
   ```

4. **Start frontend** (Terminal 3):
   ```bash
   cd frontend
   bun install
   bun run dev
   ```

5. **Install browser extension**:
   ```bash
   cd browser-extension
   bun install
   bun dev
   # Load the extension in your browser (see browser-extension/README.md)
   ```

### Production Usage
- Frontend: Access the deployed frontend at your production URL
- Network: Ensure wallet is connected to Astar network
- Extension: Load the production build of the browser extension

## Project Structure

- **`/contract`** - Hardhat project containing the Keyvault smart contract
- **`/frontend`** - React application for Web3 interactions and UI
- **`/browser-extension`** - Browser extension for credential management and encryption

## Purpose and Security Model

### Core Purpose
Keyvault provides a blockchain-based solution for securely storing, managing, and accessing encrypted credentials. It leverages blockchain's inherent security features (transparency, immutability, tamper resistance) while maintaining user privacy through client-side encryption.

### Security Approach
- **Client-Side Encryption**: All encryption/decryption occurs in the browser extension using AES-GCM
- **Append-Only Storage**: Prevents race conditions and ensures data consistency across devices
- **Public Key Infrastructure**: Enables secure sharing of credentials between users
- **Wallet-Based Authentication**: Uses blockchain wallet signatures for access control

## Data Structure and Storage

### Credential Format
Keyvault stores credentials as encrypted JSON objects with the following structure:

#### Password Credentials (Addition/Update)
```json
{
  "version": 1,
  "type": 0,
  "id": "<unique_credential_id>",
  "timestamp": "<last_updated_timestamp>",
  "isDeleted": false,
  "url": "<website_url>",
  "username": "<username>", 
  "password": "<password>",
  "description": "<optional_description>"
}
```

#### Password Credentials (Deletion)
```json
{
  "version": 1,
  "type": 0,
  "id": "<unique_credential_id>",
  "timestamp": "<deletion_timestamp>",
  "isDeleted": true,
  "url": "<website_url>"
}
```

#### Additional Credential Types
The system also supports:
- **Keypair Credentials** (`type: 1`): For storing cryptographic key pairs
- **Secret Share Credentials** (`type: 2`): For Shamir's Secret Sharing
- **Contact Credentials** (`type: 3`): For storing contact information

#### Credential Versioning System
- **`id`**: A unique identifier (generated using `crypto.getRandomValues()`) that remains constant across all versions of a credential
- **`timestamp`**: Used to order versions chronologically within a credential chain
- **Credential Chains**: All versions of a credential share the same `id`, forming a chronological chain of updates
- **New Credentials**: Get a new randomly generated `id`
- **Updated Credentials**: Keep the same `id` but get a new `timestamp`
- **Deleted Credentials**: Create a deletion record with the same `id` and `isDeleted: true`
```

### Storage Process
1. **Compression**: Credentials are shortened using the `createKeyShortener` utility, which converts objects to compact arrays by removing keys and trimming trailing null/undefined values
2. **Bundling**: Multiple shortened credentials are bundled together into arrays
3. **Serialization**: Bundles are serialized using MessagePack for efficient binary encoding
4. **Encryption**: Serialized bundles are encrypted using AES-GCM with unique initialization vectors (IVs)
5. **On-Chain Storage**: Encrypted blobs are stored as base64-encoded strings in the smart contract's `entries` mapping

### Append-Only Model
This design ensures:
- **Immutability**: Complete audit trail of all credential changes
- **Consistency**: No race conditions when accessing from multiple devices  
- **Traceability**: Full history of credential lifecycle
- **Chain Integrity**: Credentials with the same `id` form chronological chains, allowing reconstruction of complete credential history

## Encryption Details

### Algorithm: AES-GCM
- **Security**: Strong encryption with built-in authentication
- **Performance**: Efficient for both encryption and decryption
- **IV Requirement**: Each operation uses a unique Initialization Vector
- **Format**: Stored as `iv + ciphertext` concatenated string

### Why AES-GCM?
- Industry-standard encryption with proven security
- Provides both confidentiality and integrity protection
- Efficient performance for web applications
- Wide browser support for WebCrypto API

## Network Support

### Supported Networks
- **Localhost** (Chain ID: 31337): Hardhat development network
- **Shibuya** (Chain ID: 81): Astar testnet (contract deployment only)
- **Astar** (Chain ID: 592): Production mainnet

**Note**: Frontend currently supports only localhost and Astar. Shibuya support is available for contract deployment but not in the frontend interface.

### Network Configuration
- Frontend automatically detects and switches networks based on `VITE_NETWORK` environment variable
- Smart contract addresses are automatically selected per network
- Wallet network switching is handled through the UI

## Development Commands

### Contract Development
```bash
cd contract
bun run local:node      # Start local blockchain
bun run local:deploy    # Deploy to localhost
bun run hardhat console # Interactive contract debugging
```

### Frontend Development  
```bash
cd frontend
bun run dev            # Development server (localhost network)
bun run build          # Production build (Astar network)
bun run lint           # Code linting
```

### Browser Extension Development
```bash
cd browser-extension
bun dev               # Build extension for both Firefox and Chromium
bun test              # Run test suite
```

## Troubleshooting

### Common Issues

**Contract deployment address mismatch**:
- Check deployed address with: `bun hardhat ignition status localhost-london`
- Update `frontend/src/localKeyvaultAddress.ts` if needed

**Extension communication failures**:
- Verify extension is loaded and active
- Check browser console for postMessage errors
- Ensure frontend origin matches extension permissions

**Wallet connection issues**:
- Confirm MetaMask is installed and unlocked
- Verify correct network selection (localhost/Astar)
- Check wallet permissions for the application

**Transaction failures**:
- Ensure sufficient gas/tokens for transactions
- Verify contract address is correct for the network
- Check wallet nonce synchronization

## Earlier Versions

This repository represents a refactor from an earlier ink!-based implementation. The conversion to Solidity was made to improve block explorer compatibility and verification capabilities.

Previous repositories:
- [password-manager](https://github.com/lousydropout/password-manager) - Frontend and ink! smart contract
- [password-manager-extension](https://github.com/lousydropout/password-manager-extension) - Chrome extension

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](https://github.com/lousydropout/keyvault/blob/main/LICENSE) file for details.

## Acknowledgements

This project is supported by Astar's Unstoppable Community Grant program. See [UCG Overview](https://docs.google.com/presentation/d/1HH8651zROJjE3cXFCGCsP3-dXwMR2TvoclYT0WkuF5E/edit#slide=id.g24e462a4831_0_0) for details.

### Awards and Recognition
- **3rd Place** - Polkadot ink! Hackathon (Oct/Nov 2023) - Most Innovative ink! dApp
- **Honorable Mention** - Best projects using ink!athon or AZERO.ID

Special thanks to Astar's Sofiya Vasylyeva for ongoing mentorship and support throughout the development process.

For more details about the hackathon, see Tina Bregović's write-up: [Polkadot ink! Hackathon powered by Encode Club—Prizewinners and Summary](https://www.blog.encode.club/polkadot-ink-hackathon-powered-by-encode-club-prizewinners-and-summary-0ee9efac42ea#a067).
