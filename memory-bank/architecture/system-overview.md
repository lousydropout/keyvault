# System Architecture Overview

## High-Level Architecture

Keyvault is a blockchain-based password manager consisting of three main components:

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

## Component Responsibilities

### Browser Extension
- **Location**: `/browser-extension/`
- **Technology**: React, TypeScript, Vite
- **Responsibilities**:
  - Client-side encryption/decryption (AES-GCM)
  - Credential management UI
  - Local storage of encryption keys
  - Communication with frontend via postMessage API
  - Autofill functionality

### Frontend (React App)
- **Location**: `/frontend/`
- **Technology**: React, TypeScript, Vite, Wagmi, Viem
- **Responsibilities**:
  - Web3 wallet integration (MetaMask, etc.)
  - Transaction submission to blockchain
  - Network configuration (localhost/Astar)
  - Receives encrypted data from extension

### Smart Contract
- **Location**: `/contract/`
- **Technology**: Solidity 0.8.24, Hardhat, Foundry
- **Responsibilities**:
  - Append-only storage of encrypted credential blobs
  - Public key storage
  - Entry retrieval functions
  - Deployed on Astar Mainnet and localhost

## Data Flow

1. **Credential Creation/Update**:
   - User creates/edits credential in browser extension
   - Extension encrypts credential using AES-GCM
   - Encrypted data stored locally as "pending"

2. **Sync to Blockchain**:
   - User clicks "Send data to dApp" in extension
   - Extension sends encrypted data to frontend via postMessage
   - Frontend receives data and validates wallet/chain match
   - Frontend submits transaction to smart contract
   - Smart contract stores encrypted blob in append-only array

3. **Credential Retrieval**:
   - Extension queries smart contract for all entries
   - Decrypts entries using stored encryption key
   - Reconstructs credential chains from decrypted data
   - Displays credentials in UI

## Key Design Decisions

1. **Append-Only Model**: All credential changes are stored as new entries, creating an immutable audit trail
2. **Client-Side Encryption**: All encryption happens in the browser extension before blockchain storage
3. **Credential Chains**: Credentials with the same `id` form chronological chains for versioning
4. **Bundling**: Multiple credentials are bundled together before encryption to reduce transaction costs

## Network Support

- **Localhost** (Chain ID: 31337): Development network
- **Astar Mainnet** (Chain ID: 592): Production network
- **Shibuya** (Chain ID: 81): Testnet (contract deployment only)

