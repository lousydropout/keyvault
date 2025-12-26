---
date: 2025-12-25T10:35:04-08:00
author: lousydropout
git_commit: c42303162c2909255923c9895e4ed4eeb46cd56e
branch: main
repository: keyvault
title: "Deploy to Base Chain and Add Chain Switching"
status: draft
tags: [plan, base-chain, multi-chain, browser-extension, frontend]
research_doc: thoughts/shared/research/2025-12-25-base-chain-deployment.md
---

# Implementation Plan: Deploy to Base Chain and Add Chain Switching

## Goal

Deploy the Keyvault contract on Coinbase's Base chain and update:
1. Browser extension: to allow users to switch chains/contract at runtime
2. Frontend: to allow syncing to the Base chain

## Success Criteria

1. Keyvault contract deployed on Base mainnet with verified contract
2. Browser extension allows users to select between Astar, Base, and localhost chains
3. Extension reads from the correct chain's contract based on user selection
4. Frontend accepts sync requests from any supported chain
5. Chain validation prevents cross-chain submission errors
6. All existing Astar functionality continues to work
7. Single build works for all environments (dev mode toggle for localhost)

## Architecture Overview

### Current State
- Build-time network selection via `VITE_NETWORK` environment variable
- Extension creates static viem client at module load
- Frontend uses wagmi with multi-chain config (but only exposes one chain at build time)
- Separate builds required for localhost vs production

### Target State
- Runtime chain selection stored in browser storage
- Extension dynamically creates viem clients based on selected chain
- Frontend accepts any supported chain from extension messages
- Central chain configuration mapping chain ID → contract address
- Developer mode toggle enables localhost in any build
- Unified build for all environments

## Implementation Tasks

### Phase 0: Prerequisites

#### Task 0.1: Install Required UI Components
The ChainSelector component requires shadcn/ui components that don't exist yet.

```bash
cd browser-extension
bunx shadcn-ui@latest add select
bunx shadcn-ui@latest add alert-dialog
```

**Verification**: Check that these files exist after installation:
- `browser-extension/src/components/ui/select.tsx`
- `browser-extension/src/components/ui/alert-dialog.tsx`

#### Task 0.2: Verify viem Chain Exports
Ensure Base chain is available in viem:

```typescript
// Test in a scratch file or console
import { base, baseSepolia } from "viem/chains";
console.log(base.id); // Should be 8453
```

---

### Phase 1: Contract Deployment Infrastructure

#### Task 1.1: Add Base Network to Hardhat Config
**File**: `contract/hardhat.config.ts`

Add Base mainnet and Base Sepolia network configurations after line 33 (astar config):

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

Add Basescan verification config (NEW section - does not exist in current config):

```typescript
etherscan: {
  apiKey: {
    astar: process.env.ASTAR_API_KEY || "",
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
    {
      network: "baseSepolia",
      chainId: 84532,
      urls: {
        apiURL: "https://api-sepolia.basescan.org/api",
        browserURL: "https://sepolia.basescan.org",
      },
    },
  ],
},
```

**Verification**: Run `bunx hardhat compile` to ensure config is valid.

---

### Phase 1.5: Contract Deployment

#### Task 1.5.1: Deploy to Base Sepolia (Testnet First)

Always test on testnet before mainnet deployment.

**Step 1: Get Testnet ETH**
- Visit https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Request Sepolia ETH for your deployment wallet

**Step 2: Set Environment Variables**
```bash
export BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
export BASESCAN_API_KEY="your-basescan-api-key"  # Get from https://basescan.org/apis
```

**Step 3: Deploy to Testnet**
```bash
cd contract
bunx hardhat ignition deploy ignition/modules/Keyvault.ts \
  --network baseSepolia \
  --deployment-id base-sepolia-v1
```

**Step 4: Record and Verify**
```bash
# Get the deployed address
cat contract/ignition/deployments/base-sepolia-v1/deployed_addresses.json

# Verify on Basescan
bunx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

**Step 5: Test Extension Against Testnet**
Update `CHAIN_CONFIGS` temporarily with testnet address and test full flow before mainnet.

#### Task 1.5.2: Deploy to Base Mainnet

**Prerequisites**:
- Successfully tested on Base Sepolia
- Wallet funded with ~0.01 ETH on Base mainnet
- Check gas prices: https://basescan.org/gastracker

**Step 1: Deploy**
```bash
cd contract
bunx hardhat ignition deploy ignition/modules/Keyvault.ts \
  --network base \
  --deployment-id base-mainnet-v1
```

**Step 2: Record Address Immediately**
```bash
cat contract/ignition/deployments/base-mainnet-v1/deployed_addresses.json
# Example output: {"KeyvaultModule#Keyvault": "0x..."}
```

**Step 3: Verify on Basescan**
```bash
bunx hardhat verify --network base <CONTRACT_ADDRESS>
```

#### Task 1.5.3: Propagate Contract Address

**Critical**: Update the contract address in TWO locations to avoid mismatch.

```bash
# Get the deployed address
ADDRESS=$(cat contract/ignition/deployments/base-mainnet-v1/deployed_addresses.json | jq -r '.["KeyvaultModule#Keyvault"]')
echo "Deployed address: $ADDRESS"

# Update browser-extension/src/constants/chains.ts
# Update frontend/src/chains.ts
# (Manual edit - replace 0x_BASE_CONTRACT_ADDRESS_HERE with actual address)

# Verify both files have the same address
grep -r "$ADDRESS" browser-extension/src frontend/src
```

#### Task 1.5.4: Post-Deployment Verification

```bash
# Test read operations work via cast (foundry)
cast call $ADDRESS "numEntries(address)" <YOUR_WALLET_ADDRESS> --rpc-url https://mainnet.base.org
# Should return 0x0 for new address
```

---

### Phase 2: Shared Chain Configuration

#### Task 2.1: Create Chain Registry
**New File**: `browser-extension/src/constants/chains.ts`

Create a centralized chain configuration that maps chain IDs to their details:

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
  icon?: string;
};

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [astar.id]: {
    chain: astar,
    address: "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B" as Hex,
    apiUrl: import.meta.env.VITE_ASTAR_RPC_URL || "https://evm.astar.network",
    dappUrl: "https://dapp.blockchainkeyvault.com",
    name: "Astar",
  },
  [base.id]: {
    chain: base,
    address: "0x_BASE_CONTRACT_ADDRESS_HERE" as Hex, // Replace after deployment
    apiUrl: import.meta.env.VITE_BASE_RPC_URL || "https://mainnet.base.org",
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
export const DEFAULT_CHAIN_ID = astar.id; // Default for production

// Safe getter with fallback to default chain
export const getChainConfigSafe = (chainId: number): ChainConfig => {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    console.warn(`Unknown chain ID ${chainId}, falling back to default`);
    return CHAIN_CONFIGS[DEFAULT_CHAIN_ID];
  }
  return config;
};

// Validate if a chain ID is supported
export const isValidChainId = (chainId: number): boolean => {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
};
```

#### Task 2.2: Update Network Constants
**File**: `browser-extension/src/constants/networks.ts`

```typescript
export const ASTAR = "astar";
export const BASE = "base";
export const LOCALHOST = "localhost";
```

---

### Phase 3: Browser Extension - Dynamic Chain Support

#### Task 3.1: Refactor Config for Dynamic Client Creation
**File**: `browser-extension/src/config.ts`

Replace static client creation with dynamic factory functions:

```typescript
import { ASTAR, BASE, LOCALHOST } from "@/constants/networks";
import { CHAIN_CONFIGS, ChainConfig, DEFAULT_CHAIN_ID, getChainConfigSafe } from "@/constants/chains";
import { keyvaultAbi as abi } from "@/keyvault.abi";
import { createPublicClient, getContract, http, PublicClient } from "viem";
import { astar, base, hardhat } from "viem/chains";

export { abi };

// Build-time default (used for initial load before storage is read)
export const NETWORK: typeof LOCALHOST | typeof ASTAR | typeof BASE =
  import.meta.env.VITE_NETWORK === ASTAR ? ASTAR :
  import.meta.env.VITE_NETWORK === BASE ? BASE : LOCALHOST;

// Get chain config by chain ID (throws on invalid)
export const getChainConfig = (chainId: number): ChainConfig => {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
};

// Create client for a specific chain
export const createChainClient = (chainId: number): PublicClient => {
  const config = getChainConfig(chainId);
  return createPublicClient({
    chain: config.chain,
    transport: http(config.apiUrl),
  });
};

// Create contract instance for a specific chain
export const createChainContract = (chainId: number) => {
  const config = getChainConfig(chainId);
  const client = createChainClient(chainId);
  return getContract({
    abi,
    address: config.address,
    client,
  });
};

// Legacy exports for backward compatibility during migration
const defaultChainId = NETWORK === LOCALHOST ? hardhat.id :
                       NETWORK === BASE ? base.id : astar.id;
export const { chain, address, apiUrl, dappUrl } = getChainConfig(defaultChainId);
export const client = createChainClient(defaultChainId);
export const contract = createChainContract(defaultChainId);
```

#### Task 3.2: Update Chain Hook for Full Chain Switching
**File**: `browser-extension/src/side_panel/chain.ts`

Enhance the hook to manage chain state and provide dynamic client access:

```typescript
import { CREDENTIALS, ENCRYPTEDS, MODIFIED, PENDING_CREDS } from "@/constants/hookVariables";
import { CHAIN_CONFIGS, DEFAULT_CHAIN_ID, SUPPORTED_CHAIN_IDS, isValidChainId } from "@/constants/chains";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { createChainClient, createChainContract, getChainConfig } from "@/config";
import { Cred } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { useMemo, useCallback } from "react";
import { hardhat, astar } from "viem/chains";

export const useChain = () => {
  const [storedChainId, setStoredChainId] = useBrowserStoreLocal<number>(
    "chainId",
    DEFAULT_CHAIN_ID
  );
  const [_creds, setCreds] = useBrowserStoreLocal<Cred[]>(CREDENTIALS, []);
  const [_encrypteds, setEncrypteds] = useBrowserStoreLocal<Encrypted[]>(
    ENCRYPTEDS,
    []
  );
  const [pendingCreds] = useBrowserStoreLocal<Cred[]>(PENDING_CREDS, []);
  const [modified, setModified] = useBrowserStoreLocal<boolean>(
    MODIFIED,
    false
  );

  // Validate stored chainId, fallback to default if invalid (handles migration)
  const chainId = isValidChainId(storedChainId) ? storedChainId : DEFAULT_CHAIN_ID;

  // Memoize client and contract to avoid recreation on every render
  const chainConfig = useMemo(() => getChainConfig(chainId), [chainId]);
  const client = useMemo(() => createChainClient(chainId), [chainId]);
  const contract = useMemo(() => createChainContract(chainId), [chainId]);

  // Check if there's unsaved data that would be lost
  const hasUnsavedData = pendingCreds.length > 0 || modified;

  const switchChain = useCallback((newChainId: number, force: boolean = false) => {
    if (!SUPPORTED_CHAIN_IDS.includes(newChainId)) {
      throw new Error(`Unsupported chain ID: ${newChainId}`);
    }
    if (newChainId === chainId) return { switched: false, reason: "same_chain" };

    // Warn if there's unsaved data (unless forced)
    if (hasUnsavedData && !force) {
      return { switched: false, reason: "unsaved_data" };
    }

    // Clear credentials first to avoid race condition where UI briefly
    // shows old credentials with new chain context
    setCreds([]);
    setEncrypteds([]);
    setStoredChainId(newChainId);
    setModified(true);

    return { switched: true, reason: null };
  }, [chainId, hasUnsavedData, setCreds, setEncrypteds, setStoredChainId, setModified]);

  return {
    chainId,
    chainConfig,
    client,
    contract,
    switchChain,
    supportedChains: SUPPORTED_CHAIN_IDS,
    modified,
    setModified,
    hasUnsavedData,
  };
};

// Keep legacy hook for backward compatibility
export const useChainId = () => {
  const { chainId, switchChain, modified, setModified } = useChain();

  // Legacy toggle between hardhat and astar only
  const toggleChain = () => {
    switchChain(chainId === hardhat.id ? astar.id : hardhat.id, true);
  };

  return { chainId, toggleChain, modified, setModified };
};
```

#### Task 3.3: Update Contract Read Utilities to Accept Chain Parameter

**File**: `browser-extension/src/utils/getNumEntries.ts`

```typescript
import { createChainContract } from "@/config";
import { logger } from "@/utils/logger";
import { Hex } from "viem";

export const getNumEntries = async (
  pubkey: Hex,
  chainId: number
): Promise<number | undefined> => {
  try {
    const contract = createChainContract(chainId);
    const result = await contract.read.numEntries([pubkey]);
    return Number.parseInt(result?.toString() || "0");
  } catch (error) {
    logger.error("Error reading numEntries:", error);
  }
};
```

**File**: `browser-extension/src/utils/getEntries.ts`

**Note**: This file also contains `updateEncrypteds` function which needs updating.

```typescript
import { createChainContract } from "@/config";
import { Encrypted, parseEncryptedText } from "@/utils/encryption";
import { getNumEntries } from "@/utils/getNumEntries";
import { logger } from "@/utils/logger";
import { Dispatch, SetStateAction } from "react";
import { Hex } from "viem";

/**
 * Retrieves a list of encrypted entries from the contract.
 */
export const getEntries = async (
  pubkey: Hex,
  startFrom: number,
  limit: number,
  chainId: number
): Promise<Encrypted[]> => {
  try {
    const contract = createChainContract(chainId);
    const results = (await contract.read.getEntries([
      pubkey,
      BigInt(startFrom),
      BigInt(limit),
    ])) as string[];

    return Promise.all(
      results.map(async (result) => {
        if (result) {
          return parseEncryptedText(result.toString());
        } else {
          return { iv: "", ciphertext: "" };
        }
      })
    );
  } catch (error) {
    logger.error("[getEntries] ", error);
    throw error;
  }
};

/**
 * Updates the encrypted entries by fetching new entries from the chain.
 * NOTE: This function now requires chainId parameter.
 */
export const updateEncrypteds = async (
  pubkey: Hex,
  encrypteds: Encrypted[],
  setNumEntries: Dispatch<SetStateAction<number>>,
  setEncrypteds: Dispatch<SetStateAction<Encrypted[]>>,
  chainId: number
): Promise<void> => {
  const numOnChain = (await getNumEntries(pubkey, chainId)) ?? 0;
  setNumEntries(numOnChain);
  const _encrypteds: Encrypted[] = [];
  const offset = encrypteds.length;

  if (numOnChain === offset) return;

  const batchLength = 10;
  const numIterations = Math.ceil((numOnChain - offset) / batchLength);

  for (let i = 0; i < numIterations; i++) {
    const newEntries = await getEntries(
      pubkey,
      i * batchLength + offset,
      batchLength,
      chainId
    );
    _encrypteds.push(...newEntries);
  }

  if (encrypteds.length + _encrypteds.length !== numOnChain) {
    logger.warn("[updateEncrypteds] Number of on-chain entries does not match");
    logger.debug("data: ", {
      encrypteds: encrypteds,
      newEncrypteds: _encrypteds,
      numOnChain,
      batchLength,
      numIterations,
      offset,
    });
    throw new Error(
      "[updateEncrypteds] Number of on-chain entries does not match"
    );
  }

  setEncrypteds((prev) => [...prev, ..._encrypteds]);

  return;
};
```

**File**: `browser-extension/src/utils/getPublicKey.ts`

```typescript
import { createChainContract } from "@/config";
import { logger } from "@/utils/logger";
import { Hex } from "viem";

export const getPublicKey = async (
  address: Hex,
  chainId: number
): Promise<string> => {
  try {
    const contract = createChainContract(chainId);
    return contract.read.pubKey([address]);
  } catch (error) {
    logger.error("[getPublicKey] Error reading pure function:", error);
    return "";
  }
};
```

#### Task 3.3.1: Update All Callers of getNumEntries and getEntries

These files call `getNumEntries` or `getEntries` and need to pass `chainId`:

**File**: `browser-extension/src/side_panel/main.tsx`

Update line 139 to pass chainId:
```typescript
// Before:
getEntries(pubkey as Hex, encrypteds.length, limit)

// After (need to get chainId from useChain hook or props):
getEntries(pubkey as Hex, encrypteds.length, limit, chainId)
```

The component needs access to chainId. Options:
1. Add `useChain()` hook to Root component
2. Create a ChainContext provider

Recommended approach - add to Root component:
```typescript
export const Root = () => {
  const { chainId } = useChain();
  // ... rest of component

  // Update getEntries call:
  getEntries(pubkey as Hex, encrypteds.length, limit, chainId)
```

**File**: `browser-extension/src/side_panel/credentials.tsx`

Update line 77:
```typescript
// Before:
getNumEntries(pubkey as Hex).then((num) => {

// After:
const { chainId } = useChain(); // Add at top of component
getNumEntries(pubkey as Hex, chainId).then((num) => {
```

**File**: `browser-extension/src/side_panel/encryptionKeySetup.tsx`

Update line 30:
```typescript
// Before:
getNumEntries(pubkey as Hex).then((num) => {

// After:
const { chainId } = useChain(); // Add at top of component
getNumEntries(pubkey as Hex, chainId).then((num) => {
```

#### Task 3.4: Add Chain Selector UI Component
**New File**: `browser-extension/src/components/ChainSelector.tsx`

```typescript
import { useChain } from "@/side_panel/chain";
import { CHAIN_CONFIGS } from "@/constants/chains";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { hardhat } from "viem/chains";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export const ChainSelector = () => {
  const { chainId, switchChain, supportedChains, hasUnsavedData } = useChain();
  const [devMode] = useBrowserStoreLocal<boolean>("devMode", false);
  const currentChain = CHAIN_CONFIGS[chainId];
  const [pendingChainId, setPendingChainId] = useState<number | null>(null);

  // Show localhost only if:
  // 1. Developer mode is enabled in settings, OR
  // 2. Currently connected to localhost (don't hide current chain)
  const availableChains = supportedChains.filter((id) => {
    if (id === hardhat.id) {
      return devMode || chainId === hardhat.id;
    }
    return true;
  });

  const handleChainChange = (value: string) => {
    const newChainId = Number(value);
    const result = switchChain(newChainId);

    if (!result.switched && result.reason === "unsaved_data") {
      // Show confirmation dialog
      setPendingChainId(newChainId);
    }
  };

  const confirmSwitch = () => {
    if (pendingChainId !== null) {
      switchChain(pendingChainId, true); // Force switch
      setPendingChainId(null);
    }
  };

  return (
    <>
      <Select
        value={chainId.toString()}
        onValueChange={handleChainChange}
      >
        <SelectTrigger className="w-28 h-8 bg-slate-700 border-slate-600 text-white text-sm">
          <SelectValue>{currentChain?.name || "Select Chain"}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          {availableChains.map((id) => (
            <SelectItem
              key={id}
              value={id.toString()}
              className="text-white hover:bg-slate-600"
            >
              {CHAIN_CONFIGS[id].name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={pendingChainId !== null} onOpenChange={() => setPendingChainId(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Switch Chain?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              You have unsaved credentials. Switching chains will clear your current data.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSwitch}
              className="bg-red-600 hover:bg-red-700"
            >
              Switch Chain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
```

#### Task 3.5: Integrate Chain Selector into Header
**File**: `browser-extension/src/components/header.tsx`

Add ChainSelector between "Creds" and "Sync" icons (after line 113):

```typescript
import { ChainSelector } from "@/components/ChainSelector";

// ... existing imports and code ...

export const Header = () => {
  // ... existing code ...

  return (
    <div className="flex justify-around items-end px-4 mt-4">
      {/* Dashboard/Creds - existing */}
      <Icon view={view} label="Creds" onClick={() => setView("Current Page")}>
        <CredsIcon className="w-6 h-6" />
      </Icon>

      {/* Chain Selector - NEW: Insert after Creds, before Sync */}
      <ChainSelector />

      {/* Sync - existing */}
      <Icon
        view={view}
        label="Sync"
        onClick={async () => {
          // ... existing sync logic ...
        }}
      >
        <SyncIcon className="w-6 h-6" />
      </Icon>

      {/* Settings - existing */}
      <Icon view={view} label="Settings" onClick={() => setView("Settings")}>
        <SettingsIcon className="w-6 h-6" />
      </Icon>

      {/* Dropdown Menu - existing */}
      <DropdownMenu>
        {/* ... existing dropdown content ... */}
      </DropdownMenu>
    </div>
  );
};
```

#### Task 3.5.1: Add Developer Mode Toggle to Settings
**File**: `browser-extension/src/side_panel/settings.tsx`

Add developer mode toggle to enable localhost chain in any build:

```typescript
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";

// Inside Settings component:
const [devMode, setDevMode] = useBrowserStoreLocal<boolean>("devMode", false);

// Add this UI section:
<div className="flex items-center justify-between py-2">
  <div>
    <Label htmlFor="dev-mode" className="text-white">Developer Mode</Label>
    <p className="text-xs text-slate-400 mt-1">
      Enables localhost network for development testing
    </p>
  </div>
  <Switch
    id="dev-mode"
    checked={devMode}
    onCheckedChange={setDevMode}
  />
</div>
```

#### Task 3.6: Update Sync Component to Use Dynamic Chain
**File**: `browser-extension/src/side_panel/sync.tsx`

Update to use the `useChain` hook instead of importing static `chain` from config:

```typescript
import { Button } from "@/components/ui/button";
import { NUM_ENTRIES, PENDING_CREDS, PUBKEY } from "@/constants/hookVariables";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import { useCurrentTab } from "@/hooks/useCurrentTab";
import { useChain } from "@/side_panel/chain";
import { logger } from "@/utils/logger";
import { Cred, encryptEntries } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { getNumEntries } from "@/utils/getNumEntries";
import { useEffect, useState } from "react";
import { Hex } from "viem";

export const Sync = () => {
  const { chainId } = useChain();
  const [tab] = useCurrentTab();
  const tabId = tab?.id || chrome.tabs.TAB_ID_NONE;
  const [pendingCreds] = useBrowserStoreLocal<Cred[]>(PENDING_CREDS, []);
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");
  const [numEntries, setNumEntries] = useBrowserStoreLocal<number>(
    NUM_ENTRIES,
    -1
  );
  const [encrypted, setEncrypted] = useState<Encrypted>({
    iv: "",
    ciphertext: "",
  });
  const [_jwt, _setJwt, cryptoKey] = useCryptoKeyManager();
  const [sent, setSent] = useState(false);

  const getEncrypted = async () => {
    const _encrypted = await encryptEntries(
      cryptoKey as CryptoKey,
      pendingCreds
    );
    setEncrypted(_encrypted);
  };

  useEffect(() => {
    if (pendingCreds.length === 0) return;
    if (!cryptoKey) return;

    getEncrypted();
  }, [cryptoKey, pendingCreds]);

  const sendData = async (tabId: number) => {
    logger.debug("[sendData]: ", { pendingCreds, pubkey, numEntries });
    if (cryptoKey === null) return;

    const data = {
      encrypted,
      address: pubkey,
      numEntries,
      overwrite: true,
      chainId: chainId, // Use dynamic chainId from hook
    };

    logger.debug(`Forwarding the following data to tabId: ${tabId}`, data);
    chrome.tabs
      .sendMessage(tabId, { type: "FROM_EXTENSION", data })
      .catch((error) => {
        const errorMessage = error?.message || String(error);
        if (
          errorMessage.includes("Receiving end does not exist") ||
          errorMessage.includes("Could not establish connection")
        ) {
          logger.debug("[sync] Content script not available on this page");
        } else {
          logger.debug("[sync] Failed to send message:", error);
        }
      });
  };

  // Update numEntries using the current chain
  const updateNumEntries = async () => {
    getNumEntries(pubkey as Hex, chainId).then((num) => {
      if (num && num !== numEntries) {
        setNumEntries(num);
        setSent(false);
      }
    });
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (sent) updateNumEntries();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [sent, chainId]); // Re-run when chainId changes

  return (
    <div className="flex flex-col items-center justify-start gap-2 p-4">
      <h1 className="mb-16 text-4xl">Sync</h1>
      <Button
        variant="outline"
        className="w-fit bg-purple-500 hover:bg-purple-600 active:bg-purple-800 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
        onClick={() => {
          setSent(true);
          sendData(tabId);
        }}
        disabled={pendingCreds.length === 0 || sent}
      >
        {pendingCreds.length > 0 ? "Send data to dApp" : "No data to send"}
      </Button>
    </div>
  );
};
```

---

### Phase 4: Frontend - Multi-Chain Support

#### Task 4.1: Create Shared Chain Configuration
**New File**: `frontend/src/chains.ts`

```typescript
import { base, astar, hardhat } from "wagmi/chains";
import { Chain, Hex } from "viem";
import { localKeyvaultAddress } from "@/localKeyvaultAddress";

export type ChainConfig = {
  chain: Chain;
  address: Hex;
  name: string;
};

// NOTE: Contract addresses must match browser-extension/src/constants/chains.ts
// When deploying to Base, update BOTH files with the new address
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [astar.id]: {
    chain: astar,
    address: "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B" as Hex,
    name: "Astar",
  },
  [base.id]: {
    chain: base,
    address: "0x_BASE_CONTRACT_ADDRESS_HERE" as Hex, // Replace after deployment
    name: "Base",
  },
  [hardhat.id]: {
    chain: hardhat,
    address: localKeyvaultAddress,
    name: "Localhost",
  },
};

export const getContractAddress = (chainId: number): Hex => {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config.address;
};

export const isValidChainId = (chainId: number): boolean => {
  return chainId in CHAIN_CONFIGS;
};

export const SUPPORTED_CHAINS = [hardhat, astar, base];
```

#### Task 4.2: Update Frontend Config for Multi-Chain
**File**: `frontend/src/config.ts`

```typescript
import { keyvaultAbi as abi } from "@/keyvault.abi";
import { localKeyvaultAddress } from "@/localKeyvaultAddress.ts";
import { createPublicClient, Hex } from "viem";
import { createConfig, http } from "wagmi";
import { astar, base, hardhat } from "wagmi/chains";
import { CHAIN_CONFIGS, getContractAddress } from "@/chains";

export const NETWORK: "localhost" | "astar" | "base" =
  import.meta.env.VITE_NETWORK === "astar" ? "astar" :
  import.meta.env.VITE_NETWORK === "base" ? "base" : "localhost";

// Legacy setChainConfig for backward compatibility
const setChainConfig = (network: string) => {
  const allowedNetworks = new Set(["localhost", "astar", "base"]);
  if (!allowedNetworks.has(network)) throw new Error("Invalid chain");

  let chain, address, apiUrl;
  switch (network) {
    case "astar":
      chain = astar;
      address = CHAIN_CONFIGS[astar.id].address;
      apiUrl = import.meta.env.VITE_ASTAR_RPC_URL || "https://evm.astar.network";
      break;
    case "base":
      chain = base;
      address = CHAIN_CONFIGS[base.id].address;
      apiUrl = import.meta.env.VITE_BASE_RPC_URL || "https://mainnet.base.org";
      break;
    case "localhost":
      chain = hardhat;
      address = localKeyvaultAddress;
      apiUrl = "http://localhost:8545";
      break;
    default:
      throw new Error("Invalid chain");
  }
  return { chain, address, apiUrl };
};

export { abi, getContractAddress };
export const { chain, address, apiUrl } = setChainConfig(NETWORK);

// Create a client for a specific chain
export const createClientForChain = (chainId: number) => {
  const chainConfig = CHAIN_CONFIGS[chainId];
  if (!chainConfig) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return createPublicClient({
    chain: chainConfig.chain,
    transport: http()
  });
};

// Updated wagmi config with all supported chains
export const config = createConfig({
  chains: [hardhat, astar, base],
  transports: {
    [hardhat.id]: http(),
    [astar.id]: http(import.meta.env.VITE_ASTAR_RPC_URL),
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL),
  },
});

export const client = createPublicClient({ chain, transport: http() });
```

#### Task 4.3: Update App.tsx to Use Dynamic Contract Address
**File**: `frontend/src/App.tsx`

Update to handle chain from extension message and show chain mismatch UI that integrates with existing patterns:

```typescript
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastAction } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { abi, createClientForChain, getContractAddress } from "@/config";
import { isValidChainId, CHAIN_CONFIGS } from "@/chains";
import { useToast } from "@/hooks/use-toast";
import { useMessage } from "@/hooks/useMessage";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWriteContract } from "wagmi";

export default function App() {
  const message = useMessage();
  const account = useAccount();
  const connectedChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  const [isOkay, setIsOkay] = useState<boolean>(false);
  const [ciphertext, setCiphertext] = useState<string>("");
  const { writeContract, isPending, isSuccess, error } = useWriteContract();
  const [submitted, setSubmitted] = useState<boolean>(false);

  const submit = async (ciphertext: string) => {
    if (!account?.address) return;

    const targetChainId = message?.chainId || connectedChainId;

    // Validate the target chain
    if (!isValidChainId(targetChainId)) {
      toast({
        variant: "destructive",
        title: "Invalid Chain",
        description: `Chain ID ${targetChainId} is not supported.`,
      });
      return;
    }

    // Defensive check - wallet must be on target chain
    // wagmi's writeContract submits to wallet's connected chain, not targetChainId
    if (targetChainId !== connectedChainId) {
      toast({
        variant: "destructive",
        title: "Chain Mismatch",
        description: "Please switch your wallet to the correct chain first.",
      });
      return;
    }

    // Get the correct contract address for the target chain
    const contractAddress = getContractAddress(targetChainId);

    // Create client for the target chain to get correct nonce
    const targetClient = createClientForChain(targetChainId);

    writeContract({
      abi,
      address: contractAddress,
      functionName: "storeEntry",
      args: [ciphertext],
      nonce: await targetClient.getTransactionCount({ address: account.address }),
    });
    setSubmitted(true);
  };

  const handleSwitchChain = async () => {
    if (message?.chainId) {
      try {
        await switchChain({ chainId: message.chainId });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Chain Switch Failed",
          description: "Could not switch to the requested chain.",
        });
        console.error("Failed to switch chain:", error);
      }
    }
  };

  useEffect(() => {
    if (isSuccess) toast({ description: "Success!" });
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: error?.name,
        description: "Would you like to retry?",
        action: (
          <ToastAction altText="Try again" onClick={() => submit(ciphertext)}>
            Resubmit
          </ToastAction>
        ),
      });
      console.log("error: ", error);
    }
  }, [error]);

  useEffect(() => {
    if (account && message) {
      toast({ description: "Received data." });

      setIsOkay(
        account?.address?.toLowerCase() === message?.address?.toLowerCase() &&
        connectedChainId === message?.chainId
      );
    }
  }, [message, account, connectedChainId]);

  useEffect(() => {
    if (!isOkay) return;

    const encrypted = message?.encrypted;
    if (!encrypted) return;
    setCiphertext(encrypted.iv + encrypted.ciphertext);
  }, [isOkay]);

  // Helper to get chain name
  const getChainName = (chainId: number) =>
    CHAIN_CONFIGS[chainId]?.name || `Chain ${chainId}`;

  console.log("VITE_NETWORK: ", import.meta.env.VITE_NETWORK);
  return (
    <ErrorBoundary>
      <div className="flex flex-1 flex-col items-center mt-16 gap-16">
        <h1 className="text-slate-200 text-center text-4xl">
          Let's update your on-chain data!
        </h1>

        {((!submitted && message) || error) && (
          <>
            <p className="text-slate-300 text-lg text-left">Received data</p>

            {isOkay ? (
              <>
                <p className="text-slate-300 text-lg text-left">
                  Looks like you have an update to push on-chain.
                </p>
                <Button
                  variant="outline"
                  disabled={isPending || ciphertext === ""}
                  onClick={async () => {
                    console.log("submitting: ", ciphertext);
                    await submit(ciphertext);
                  }}
                >
                  Push data
                </Button>
                {error ? <p className="text-red-400">{error.message}</p> : <></>}
              </>
            ) : (
              <div className="text-slate-300 text-lg text-left">
                {account?.address?.toLowerCase() !== message?.address?.toLowerCase() && (
                  <p className="text-red-300">
                    Error: The data you sent is for a different account:{" "}
                    {message?.address}
                  </p>
                )}
                {connectedChainId !== message?.chainId && (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-yellow-300">
                      Chain mismatch: Extension is using{" "}
                      <strong>{getChainName(message?.chainId || 0)}</strong>,
                      but wallet is on{" "}
                      <strong>{getChainName(connectedChainId)}</strong>.
                    </p>
                    <Button onClick={handleSwitchChain}>
                      Switch to {getChainName(message?.chainId || 0)}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {!submitted && !message && (
          <p className="text-slate-300 text-lg text-left">
            Waiting for data. . .
          </p>
        )}
        {submitted && isSuccess && (
          <p className="text-slate-300 text-lg text-left">
            Submitted, please close this tab.
          </p>
        )}

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
```

#### Task 4.4: Update Header to Show Current Chain
**File**: `frontend/src/components/header.tsx`

Update to show which chain the user is connected to:

```typescript
import { Button } from "@/components/ui/button";
import { NETWORK } from "@/config";
import { CHAIN_CONFIGS } from "@/chains";
import { Connect } from "@/Connect";
import { useAccount, useChainId } from "wagmi";

const Chain = () => {
  const account = useAccount();
  const currentChainId = useChainId();

  if (!account?.isConnected) {
    return null;
  }

  const chainName = CHAIN_CONFIGS[currentChainId]?.name || `Chain ${currentChainId}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-sm">{chainName}</span>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="flex items-end justify-between mt-4">
      <a href="/" className="text-violet-400 font-semibold text-5xl">
        Keyvault
      </a>
      <div className="flex gap-2 items-center">
        <Chain />
        <Connect />
      </div>
    </div>
  );
};
```

---

### Phase 5: Testing and Verification

#### Task 5.1: Local Multi-Chain Testing Setup

**Option A: Single Hardhat Node (Simpler)**
Test chain switching logic against localhost only:

```bash
# Terminal 1: Start Hardhat node
cd contract && bun run local:node

# Terminal 2: Deploy contract
cd contract && bun run local:deploy

# Terminal 3: Build and run extension
cd browser-extension && bun run dev

# Terminal 4: Build and run frontend
cd frontend && bun run dev
```

Enable developer mode in extension settings to see localhost option.

**Option B: Anvil Fork (Realistic Testing)**
Fork Base mainnet locally to test against real chain data:

```bash
# Install foundry if not present
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Fork Base mainnet
anvil --fork-url https://mainnet.base.org --chain-id 8453 --port 8546

# Update CHAIN_CONFIGS temporarily to point Base to localhost:8546
```

#### Task 5.2: Integration Testing Checklist

**Extension Tests**:
- [ ] Extension loads with default chain (Astar)
- [ ] Extension handles invalid stored chainId gracefully (migration case)
- [ ] Chain selector displays Astar and Base (localhost only with dev mode)
- [ ] Switching chains shows confirmation dialog when unsaved data exists
- [ ] Confirming chain switch clears credentials and encrypted data
- [ ] Canceling chain switch keeps current chain and data
- [ ] Contract reads work for each chain (getNumEntries, getEntries)
- [ ] Developer mode toggle appears in settings
- [ ] Enabling developer mode shows localhost in chain selector

**Sync Tests**:
- [ ] Sync sends correct chainId in message to frontend
- [ ] Sync button opens correct dApp URL
- [ ] Encrypted data is sent correctly

**Frontend Tests**:
- [ ] Frontend detects chain mismatch and shows warning
- [ ] "Switch Chain" button triggers wallet chain switch
- [ ] Chain switch in wallet works correctly
- [ ] After chain switch, isOkay becomes true
- [ ] Transaction submits to correct contract address
- [ ] Nonce is fetched from correct chain
- [ ] Success toast appears after transaction

**Cross-Chain Tests**:
- [ ] Create credential on Astar, sync, verify on-chain
- [ ] Switch to Base in extension, verify credentials cleared
- [ ] Create credential on Base, sync, verify on-chain
- [ ] Switch back to Astar, verify original credentials load

#### Task 5.3: Testnet Deployment Verification

Before mainnet:
- [ ] Contract deployed to Base Sepolia
- [ ] Contract verified on Sepolia Basescan
- [ ] Extension connects to testnet contract
- [ ] Full sync flow works on testnet
- [ ] Transaction succeeds on testnet

#### Task 5.4: Production Deployment Checklist

1. [ ] Deploy contract to Base mainnet
2. [ ] Record contract address from deployment output
3. [ ] Update `CHAIN_CONFIGS` in **BOTH** files:
   - [ ] `browser-extension/src/constants/chains.ts`
   - [ ] `frontend/src/chains.ts`
4. [ ] Verify contract on Basescan
5. [ ] Build extension: `cd browser-extension && bun run build`
6. [ ] Build frontend: `cd frontend && bun run build`
7. [ ] Deploy frontend to hosting
8. [ ] Test end-to-end flow on Base mainnet
9. [ ] Verify Astar still works (regression test)

---

## File Change Summary

### New Files
| File | Purpose |
|------|---------|
| `browser-extension/src/constants/chains.ts` | Central chain configuration registry |
| `browser-extension/src/components/ChainSelector.tsx` | UI component for chain selection with confirmation dialog |
| `browser-extension/src/components/ui/select.tsx` | shadcn/ui Select component (installed) |
| `browser-extension/src/components/ui/alert-dialog.tsx` | shadcn/ui AlertDialog component (installed) |
| `frontend/src/chains.ts` | Frontend chain configuration |

### Modified Files
| File | Changes |
|------|---------|
| `contract/hardhat.config.ts` | Add Base networks and NEW etherscan verification config section |
| `browser-extension/src/constants/networks.ts` | Add BASE constant |
| `browser-extension/src/config.ts` | Add dynamic client/contract creation factories |
| `browser-extension/src/side_panel/chain.ts` | Enhanced useChain hook with validation, switching, memoization |
| `browser-extension/src/utils/getNumEntries.ts` | Add chainId parameter |
| `browser-extension/src/utils/getEntries.ts` | Add chainId parameter to getEntries AND updateEncrypteds |
| `browser-extension/src/utils/getPublicKey.ts` | Add chainId parameter |
| `browser-extension/src/side_panel/main.tsx` | Pass chainId to getEntries calls |
| `browser-extension/src/side_panel/credentials.tsx` | Use useChain hook, pass chainId to getNumEntries |
| `browser-extension/src/side_panel/encryptionKeySetup.tsx` | Use useChain hook, pass chainId to getNumEntries |
| `browser-extension/src/components/header.tsx` | Add ChainSelector between Creds and Sync icons |
| `browser-extension/src/side_panel/settings.tsx` | Add developer mode toggle |
| `browser-extension/src/side_panel/sync.tsx` | Use useChain hook for dynamic chainId |
| `frontend/src/config.ts` | Add Base chain, createClientForChain, multi-chain wagmi config |
| `frontend/src/App.tsx` | Chain mismatch UI, dynamic contract address, correct nonce fetch |
| `frontend/src/components/header.tsx` | Show current chain name |

### Environment Variables (New)
| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_ASTAR_RPC_URL` | Astar RPC endpoint | `https://evm.astar.network` |
| `VITE_BASE_RPC_URL` | Base RPC endpoint | `https://mainnet.base.org` |
| `BASE_RPC_URL` | Base RPC for contract deployment | `https://mainnet.base.org` |
| `BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC for testnet deployment | `https://sepolia.base.org` |
| `BASESCAN_API_KEY` | Basescan API key for verification | - |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Contract deployment fails on Base | Low | High | Deploy to Base Sepolia first, verify gas funding |
| Users confused by chain switching | Medium | Medium | Clear UI indicators, confirmation dialog, chain name in header |
| Data loss on chain switch | Low | High | Confirmation dialog warns users, requires explicit confirmation |
| RPC rate limiting on Base | Medium | Low | Support custom RPC URLs via env vars |
| Invalid stored chainId after update | Low | Medium | Fallback to default chain with console warning |
| Nonce mismatch on wrong chain | Low | High | Create chain-specific client for nonce lookup |
| Address mismatch between extension/frontend | Medium | High | Document both files must be updated, add verification step |
| Missing UI components | Low | Medium | Phase 0 prerequisites ensure components installed first |

---

## Resolved Decisions

1. **Default chain for new users**: Keep Astar as default to avoid breaking existing users ✓

2. **Localhost visibility**: Use developer mode toggle instead of build-time filtering ✓
   - Single build works for all environments
   - Developers can enable localhost when needed
   - Hidden from end users by default

3. **dApp URL per chain**: Use single dApp URL that handles all chains ✓

4. **Testnet strategy**: Deploy to Base Sepolia first, test, then mainnet ✓

## Open Decisions

1. **Shared constants package**: Currently contract addresses are duplicated in browser-extension and frontend. Consider creating a shared package if more constants need sharing.

2. **Chain icons**: The `ChainConfig` type supports `icon` field but it's not implemented in the UI. Add chain logos to ChainSelector if desired.

3. **Migration handling**: What happens to users who have credentials on Astar when they switch to Base? Currently they just see empty state. Consider showing a message explaining credentials are chain-specific.
