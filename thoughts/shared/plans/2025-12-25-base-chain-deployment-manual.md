---
date: 2025-12-26
author: lousydropout
title: "Base Chain Deployment - Manual Execution Guide"
status: ready
tags: [plan, base-chain, multi-chain, manual, claude-code-web]
parent_plan: thoughts/shared/plans/2025-12-25-base-chain-deployment.md
---

# Base Chain Deployment - Manual Execution Guide

## Overview
Deploy Keyvault to Base chain and add runtime chain switching.

### Execution Environment Key

| Icon | Meaning |
|------|---------|
| :cloud: | **Claude Code Web can do this** (cloud sandbox) |
| :computer: | **Do locally** (needs browser, keys, or persistent processes) |

---

## Phase 1: Contract Setup

### Step 1.1: Update Hardhat Config :cloud:
**File**: `contract/hardhat.config.ts`

Add after the `astar` network config (~line 33):

```typescript
base: {
  url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
  chainId: 8453,
  accounts: [PRIVATE_KEY],
},
baseSepolia: {
  url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
  chainId: 84532,
  accounts: [PRIVATE_KEY],
},
```

Add new `etherscan` section for verification:

```typescript
etherscan: {
  apiKey: {
    base: process.env.BASESCAN_API_KEY || "",
    baseSepolia: process.env.BASESCAN_API_KEY || "",
  },
  customChains: [
    {
      network: "base",
      chainId: 8453,
      urls: {
        apiURL: "https://api.basescan.org/api",
        browserURL: "https://basescan.org",
      },
    },
  ],
},
```

### Step 1.1 Verification :cloud:
```bash
cd contract
bunx hardhat compile
```
Should compile without errors.

### Step 1.2: Deploy to Base Sepolia (Testnet) :computer:
```bash
# Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
# Get Basescan API key from: https://basescan.org/apis

cd contract
bunx hardhat ignition deploy ignition/modules/Keyvault.ts \
  --network baseSepolia \
  --deployment-id base-sepolia-v1

# Verify
bunx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

### Step 1.3: Deploy to Base Mainnet :computer:
```bash
cd contract
bunx hardhat ignition deploy ignition/modules/Keyvault.ts \
  --network base \
  --deployment-id base-mainnet-v1

bunx hardhat verify --network base <CONTRACT_ADDRESS>
```

**Save the deployed address** - you'll need it for Steps 2.1 and 3.1.

---

## Phase 2: Browser Extension Updates

### Step 2.1: Create Chain Registry :cloud:
**New file**: `browser-extension/src/constants/chains.ts`

```typescript
import { base, astar, hardhat } from "viem/chains";
import { Chain, Hex } from "viem";
import { localKeyvaultAddress } from "@/utils/localKeyvaultAddress";

export type ChainConfig = {
  chain: Chain;
  address: Hex;
  apiUrl: string;
  dappUrl: string;
  name: string;
};

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [astar.id]: {
    chain: astar,
    address: "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B" as Hex,
    apiUrl: "https://evm.astar.network",
    dappUrl: "https://dapp.blockchainkeyvault.com",
    name: "Astar",
  },
  [base.id]: {
    chain: base,
    address: "0x_YOUR_BASE_ADDRESS_HERE" as Hex, // <-- REPLACE after deployment
    apiUrl: "https://mainnet.base.org",
    dappUrl: "https://dapp.blockchainkeyvault.com",
    name: "Base",
  },
  [hardhat.id]: {
    chain: hardhat,
    address: localKeyvaultAddress,
    apiUrl: "http://localhost:8545",
    dappUrl: "http://localhost:5173",
    name: "Localhost",
  },
};

export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_CONFIGS).map(Number);
export const DEFAULT_CHAIN_ID = astar.id;

export const getChainConfig = (chainId: number): ChainConfig => {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) throw new Error(`Unsupported chain: ${chainId}`);
  return config;
};
```

### Step 2.2: Update Config for Dynamic Clients :cloud:
**File**: `browser-extension/src/config.ts`

Add these factory functions:

```typescript
import { CHAIN_CONFIGS, getChainConfig } from "@/constants/chains";

// Dynamic client creation
export const createChainClient = (chainId: number) => {
  const config = getChainConfig(chainId);
  return createPublicClient({
    chain: config.chain,
    transport: http(config.apiUrl),
  });
};

export const createChainContract = (chainId: number) => {
  const config = getChainConfig(chainId);
  const client = createChainClient(chainId);
  return getContract({ abi, address: config.address, client });
};
```

### Step 2.3: Update Contract Utilities :cloud:
Add `chainId` parameter to these files:

**`browser-extension/src/utils/getNumEntries.ts`**:
```typescript
export const getNumEntries = async (pubkey: Hex, chainId: number) => {
  const contract = createChainContract(chainId);
  return Number(await contract.read.numEntries([pubkey]));
};
```

**`browser-extension/src/utils/getEntries.ts`**:
```typescript
export const getEntries = async (
  pubkey: Hex, startFrom: number, limit: number, chainId: number
) => {
  const contract = createChainContract(chainId);
  // ... rest of function
};
```

**Update all callers** - search for usages of these functions and add chainId parameter.

### Step 2.4: Install UI Components :cloud:
```bash
cd browser-extension
bunx shadcn-ui@latest add select alert-dialog
```

### Step 2.5: Create Chain Selector Component :cloud:
**New file**: `browser-extension/src/components/ChainSelector.tsx`

See full plan (Task 3.4) for complete ~80 line component with:
- Select dropdown for chain selection
- AlertDialog for unsaved data warning

### Step 2.6: Add to Header :cloud:
**File**: `browser-extension/src/components/header.tsx`

```typescript
import { ChainSelector } from "@/components/ChainSelector";

// Add between Creds icon and Sync icon:
<ChainSelector />
```

### Phase 2 Verification :cloud:
```bash
cd browser-extension

# Install dependencies (in case new ones added)
bun install

# Type check
bun run typecheck

# Build
bun run build
```

All three should pass without errors.

---

## Phase 3: Frontend Updates

### Step 3.1: Create Chain Config :cloud:
**New file**: `frontend/src/chains.ts`

```typescript
import { base, astar, hardhat } from "wagmi/chains";
import { Hex } from "viem";

export const CHAIN_CONFIGS: Record<number, { address: Hex; name: string }> = {
  [astar.id]: {
    address: "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B" as Hex,
    name: "Astar",
  },
  [base.id]: {
    address: "0x_YOUR_BASE_ADDRESS_HERE" as Hex, // <-- REPLACE (same as Step 2.1)
    name: "Base",
  },
  [hardhat.id]: {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Hex,
    name: "Localhost",
  },
};

export const getContractAddress = (chainId: number): Hex => {
  return CHAIN_CONFIGS[chainId]?.address;
};
```

### Step 3.2: Update Wagmi Config :cloud:
**File**: `frontend/src/config.ts`

```typescript
import { base } from "wagmi/chains";

export const config = createConfig({
  chains: [hardhat, astar, base], // Add base
  transports: {
    [hardhat.id]: http(),
    [astar.id]: http(),
    [base.id]: http(), // Add this
  },
});
```

### Step 3.3: Add Chain Mismatch UI :cloud:
**File**: `frontend/src/App.tsx`

Add chain mismatch handling - when `message.chainId !== connectedChainId`, show:

```tsx
<Button onClick={() => switchChain({ chainId: message.chainId })}>
  Switch to {CHAIN_CONFIGS[message.chainId]?.name}
</Button>
```

### Phase 3 Verification :cloud:
```bash
cd frontend

# Install dependencies
bun install

# Type check
bun run typecheck

# Build
bun run build
```

All should pass without errors.

---

## Phase 4: Testing

### Cloud-Testable (Claude Code Web) :cloud:

```bash
# Contract compilation
cd contract && bunx hardhat compile

# Contract unit tests (if any exist)
cd contract && bunx hardhat test

# Extension build
cd browser-extension && bun install && bun run typecheck && bun run build

# Frontend build
cd frontend && bun install && bun run typecheck && bun run build
```

**All commands should exit 0 with no errors.**

### Local Integration Testing :computer:

Run through manually in browser:

**Setup:**
```bash
# Terminal 1: Start hardhat node
cd contract && bun run local:node

# Terminal 2: Deploy to localhost
cd contract && bun run local:deploy

# Terminal 3: Run frontend dev server
cd frontend && bun run dev

# Load extension in Chrome (developer mode)
```

**Test Checklist:**
- [ ] Extension loads, shows Astar by default
- [ ] Chain selector shows Astar and Base (localhost if dev mode enabled)
- [ ] Switching chains clears credentials (with warning if unsaved)
- [ ] Contract reads work on selected chain
- [ ] Sync sends correct chainId to frontend
- [ ] Frontend shows chain mismatch warning when needed
- [ ] "Switch Chain" button triggers wallet prompt
- [ ] Transaction submits to correct contract address

### Production Smoke Test :computer:

After deploying to Base mainnet:
- [ ] Extension can read from Base contract
- [ ] Extension can read from Astar contract
- [ ] Switching between chains works
- [ ] Sync to Base chain succeeds
- [ ] Sync to Astar chain still works (regression)

---

## Quick Reference

| What | Where |
|------|-------|
| Base contract address | Update in `browser-extension/src/constants/chains.ts` AND `frontend/src/chains.ts` |
| Chain selector UI | `browser-extension/src/components/ChainSelector.tsx` |
| Dynamic client creation | `browser-extension/src/config.ts` |
| Frontend chain config | `frontend/src/chains.ts` |

---

## Files Changed Summary

### New Files (5)
- `browser-extension/src/constants/chains.ts` - Chain registry
- `browser-extension/src/components/ChainSelector.tsx` - Chain selector UI
- `browser-extension/src/components/ui/select.tsx` - shadcn component (installed)
- `browser-extension/src/components/ui/alert-dialog.tsx` - shadcn component (installed)
- `frontend/src/chains.ts` - Frontend chain config

### Modified Files (7)
- `contract/hardhat.config.ts` - Add Base networks
- `browser-extension/src/config.ts` - Add dynamic client factories
- `browser-extension/src/utils/getNumEntries.ts` - Add chainId param
- `browser-extension/src/utils/getEntries.ts` - Add chainId param
- `browser-extension/src/components/header.tsx` - Add ChainSelector
- `frontend/src/config.ts` - Add Base to wagmi
- `frontend/src/App.tsx` - Add chain mismatch UI

---

## Claude Code Web Session Template

Start your Claude Code Web session with:

```
Read the plan at thoughts/shared/plans/2025-12-25-base-chain-deployment-manual.md

Implement all :cloud: steps in Phase [1/2/3].

After completing each step, run the verification commands.
Report any errors before moving to the next step.
```
