---
date: 2025-12-25T10:29:21-08:00
researcher: lousydropout
git_commit: c42303162c2909255923c9895e4ed4eeb46cd56e
branch: main
repository: keyvault
topic: "Deploying to Base Chain and Adding Chain Switching"
tags: [research, codebase, base-chain, multi-chain, deployment, browser-extension, frontend]
status: complete
last_updated: 2025-12-25
last_updated_by: lousydropout
---

# Research: Deploying to Base Chain and Adding Chain Switching

**Date**: 2025-12-25T10:29:21-08:00
**Researcher**: lousydropout
**Git Commit**: c42303162c2909255923c9895e4ed4eeb46cd56e
**Branch**: main
**Repository**: keyvault

## Research Question

How to deploy the Keyvault contract on Coinbase's Base chain and update:
1. Browser extension: to allow users to switch chains/contract
2. Frontend: to allow syncing to the Base chain

## Summary

The Keyvault codebase currently supports two networks (Localhost/Hardhat and Astar mainnet) with build-time network selection via the `VITE_NETWORK` environment variable. To add Base chain support and runtime chain switching:

1. **Contract Deployment**: Add Base network to `hardhat.config.ts` and deploy using Hardhat Ignition
2. **Browser Extension**: Extend `config.ts` to include Base chain configuration, enhance the existing `useChainId` hook to update the viem client, and add a UI component for chain selection
3. **Frontend**: Add Base chain to wagmi config, update `setChainConfig()` function, and the chain ID validation already supports runtime switching via wagmi's `useSwitchChain`

## Detailed Findings

### 1. Smart Contract Architecture

#### Contract: Keyvault.sol
**Location**: `contract/contracts/Keyvault.sol`

The contract is a minimal, append-only storage system for encrypted credentials:

**Core Functions**:
- `storeEntry(string memory entry)` - Stores encrypted credential blob (line 19-27)
- `getEntries(address account, uint256 startFrom, uint256 limit)` - Paginated retrieval (line 47-59)
- `storePubkey(string memory pubkey)` - Stores user's public key (line 72-74)
- `resetEntries()` - Resets entry counter without deleting data (line 64-66)

**No constructor arguments** - Makes deployment identical across all chains.

#### Current Deployments

| Network | Chain ID | Contract Address | Deployment ID |
|---------|----------|------------------|---------------|
| Astar Mainnet | 592 | `0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B` | astar-london |
| Shibuya Testnet | 81 | `0xcEed8a0537BcEe48e8BfD0a7886403e4093E7845` | shibuya-london |
| Localhost | 31337 | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | localhost-london |

### 2. Hardhat Configuration

**Location**: `contract/hardhat.config.ts`

```typescript
// Lines 24-40: Current network configuration
networks: {
  shibuya: {
    url: "https://evm.shibuya.astar.network",
    chainId: 81,
    accounts: [PRIVATE_KEY],
  },
  astar: {
    url: "https://evm.astar.network",
    chainId: 592,
    accounts: [PRIVATE_KEY],
  },
  localhost: {
    url: "http://localhost:8545",
    chainId: 31337,
    accounts: [LOCAL_PRIVATE_KEY],
  },
},
```

**To add Base chain**, add these entries:

```typescript
base: {
  url: "https://mainnet.base.org",
  chainId: 8453,
  accounts: [PRIVATE_KEY],
},
baseSepolia: {
  url: "https://sepolia.base.org",
  chainId: 84532,
  accounts: [PRIVATE_KEY],
},
```

### 3. Browser Extension Architecture

**Location**: `browser-extension/src/`

#### Current Configuration (`browser-extension/src/config.ts`)

```typescript
// Lines 9-10: Build-time network selection
export const NETWORK: typeof LOCALHOST | typeof ASTAR =
  import.meta.env.VITE_NETWORK === ASTAR ? ASTAR : LOCALHOST;

// Lines 19-41: Chain configuration function
const setChainConfig = (network: string) => {
  switch (network) {
    case "astar":
      chain = astar;
      address = "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B";
      apiUrl = "https://evm.astar.network";
      dappUrl = "https://dapp.blockchainkeyvault.com";
      break;
    case "localhost":
      chain = hardhat;
      address = localKeyvaultAddress;
      apiUrl = "http://localhost:8545";
      dappUrl = "http://localhost:5173";
      break;
  }
};

// Lines 44-46: Static client creation (problem for runtime switching)
export const { chain, address, apiUrl, dappUrl } = setChainConfig(NETWORK);
export const client = createPublicClient({ chain, transport: http() });
export const contract = getContract({ abi, address, client });
```

#### Chain State Hook (`browser-extension/src/side_panel/chain.ts`)

```typescript
// Lines 12-39: Existing chain toggle (only updates local state, not client)
export const useChainId = () => {
  const [chainId, setChainId] = useBrowserStoreLocal<number>(
    "chainId",
    NETWORK === LOCALHOST ? hardhat.id : astar.id
  );

  const toggleChain = () => {
    setChainId(chainId === hardhat.id ? astar.id : hardhat.id);
    setCreds([]);           // Clears credentials on switch
    setEncrypteds([]);      // Clears encrypted data
    setModified(true);
  };
};
```

**Key Issue**: The current `toggleChain` only updates the `chainId` state but does NOT recreate the viem `client` or `contract` objects. For true runtime chain switching, the extension needs to:
1. Store chain configuration in browser storage
2. Dynamically create clients based on selected chain
3. Provide UI for chain selection

#### Contract Interactions (Read-only in Extension)

The browser extension only reads from the contract:
- `browser-extension/src/utils/getPublicKey.ts:7` - `contract.read.pubKey()`
- `browser-extension/src/utils/getNumEntries.ts:9` - `contract.read.numEntries()`
- `browser-extension/src/utils/getEntries.ts:23` - `contract.read.getEntries()`

All write operations are performed by sending data to the frontend dApp via `chrome.tabs.sendMessage()`.

### 4. Frontend Architecture

**Location**: `frontend/src/`

#### Current Configuration (`frontend/src/config.ts`)

```typescript
// Lines 8-9: Build-time selection
export const NETWORK: "localhost" | "astar" =
  import.meta.env.VITE_NETWORK === "astar" ? "astar" : "localhost";

// Lines 17-38: Chain configuration
const setChainConfig = (network: string) => {
  switch (network) {
    case "astar":
      chain = astar;
      address = "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B";
      apiUrl = "https://evm.astar.network";
      break;
    case "localhost":
      chain = hardhat;
      address = localKeyvaultAddress;
      break;
  }
};

// Lines 43-49: Wagmi config (already supports multiple chains)
export const config = createConfig({
  chains: [hardhat, astar],  // Add base here
  transports: {
    [hardhat.id]: http(),
    [astar.id]: http(),      // Add [base.id]: http() here
  },
});
```

#### Chain Validation Already Exists

**`frontend/src/App.tsx:57-60`**: Validates chain ID from extension matches connected wallet:
```typescript
setIsOkay(
  account?.address?.toLowerCase() === message?.address?.toLowerCase() && 
  chainId === message?.chainId
);
```

**`frontend/src/components/header.tsx:6-25`**: Already has network switching button:
```typescript
const Chain = () => {
  const { switchChain } = useSwitchChain();
  
  if (chain.id !== account.chainId) {
    return (
      <Button onClick={() => switchChain({ chainId: chain.id })}>
        Switch network
      </Button>
    );
  }
};
```

#### Sync Mechanism

The frontend receives data from the browser extension via `postMessage`:

**`frontend/src/hooks/useMessage.ts:56-84`**: Listens for `FROM_EXTENSION` messages containing:
```typescript
type Context = {
  address: string;      // User's wallet address
  chainId: number;      // Target chain ID (used for validation)
  encrypted: Encrypted; // AES-GCM encrypted credential
  numEntries: number;   // Current entry count
};
```

The `chainId` in this message determines which chain the write transaction should target.

### 5. Sync Flow Between Extension and Frontend

```
┌─────────────────────┐     postMessage      ┌─────────────────────┐
│  Browser Extension  │ ──────────────────►  │      Frontend       │
│  (reads contract)   │   { chainId, ... }   │  (writes contract)  │
└─────────────────────┘                      └─────────────────────┘
         │                                            │
         │ viem (read)                               │ wagmi (write)
         ▼                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Smart Contract (on-chain)                    │
└─────────────────────────────────────────────────────────────────┘
```

For multi-chain support:
1. Extension must read from the correct chain's contract
2. Extension must send correct `chainId` in the message
3. Frontend validates `chainId` matches user's connected wallet chain
4. Frontend prompts user to switch chains if mismatched

## Code References

### Contract Deployment
- `contract/hardhat.config.ts:24-40` - Network configuration
- `contract/ignition/modules/Keyvault.ts:3-7` - Ignition deployment module
- `contract/scripts/get-and-copy-address.sh` - Address distribution script

### Browser Extension
- `browser-extension/src/config.ts:9-46` - Chain configuration and client creation
- `browser-extension/src/side_panel/chain.ts:12-39` - Chain ID state hook
- `browser-extension/src/constants/networks.ts:1-2` - Network constants
- `browser-extension/src/side_panel/sync.tsx:45-76` - Sync flow with chainId

### Frontend
- `frontend/src/config.ts:8-51` - Chain and wagmi configuration
- `frontend/src/hooks/useMessage.ts:21-27` - Context type with chainId
- `frontend/src/App.tsx:57-60` - Chain ID validation
- `frontend/src/components/header.tsx:6-25` - Network switch button

### Deployed Addresses
- `contract/ignition/deployments/astar-london/deployed_addresses.json` - Astar address
- `contract/ignition/deployments/shibuya-london/deployed_addresses.json` - Shibuya address

## Architecture Documentation

### Current Multi-Chain Pattern

**Build-time Selection**: The `VITE_NETWORK` environment variable determines which network configuration is used at build time. This creates separate builds for development (localhost) and production (astar).

**Wagmi Multi-Chain**: The frontend's wagmi config already supports multiple chains in the `chains` array, enabling runtime chain switching via `useSwitchChain()`.

**Extension Limitation**: The browser extension creates a static viem client at module initialization, preventing runtime chain switching without architectural changes.

### Recommended Pattern for Adding Base

1. **Contract Deployment**: Deploy to Base using same Ignition module
2. **Configuration Extension**: Add Base chain config to both extension and frontend
3. **Runtime Chain Selection**:
   - Extension: Create chain selection UI, store selection in browser storage, dynamically create clients
   - Frontend: Add Base to wagmi chains array (minimal change, already supports runtime switching)
4. **Address Management**: Create a central mapping of chain ID → contract address

## Base Chain Information

| Property | Base Mainnet | Base Sepolia (Testnet) |
|----------|--------------|------------------------|
| Chain ID | 8453 | 84532 |
| RPC URL | https://mainnet.base.org | https://sepolia.base.org |
| Block Explorer | https://basescan.org | https://sepolia.basescan.org |
| Native Currency | ETH | ETH |

**Viem Chain Import**: `import { base, baseSepolia } from "viem/chains"`

## Open Questions

1. **Single dApp URL or Multiple?**: Should each chain have its own dApp URL, or use a single dApp that handles all chains?
2. **Contract Address Storage**: Should addresses be stored in a central config file, or use environment variables per chain?
3. **Default Chain**: What should be the default chain for new users - Astar (existing) or Base (new)?
4. **Migration Path**: How should existing Astar users migrate their encrypted credentials to Base (if at all)?
5. **Testnet Strategy**: Should Base Sepolia be added alongside Base mainnet for testing?
