# Smart Contract Component

## Overview

The Keyvault smart contract provides append-only storage for encrypted credential data on the blockchain.

## Contract Details

- **Language**: Solidity 0.8.24
- **Network**: Astar Mainnet (Chain ID: 592)
- **Deployed Address**: `0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B`
- **License**: GPL-3.0

## Contract Structure

### Storage Variables

```solidity
mapping(address => uint256) public numEntries;
mapping(address => string[]) private entries;
mapping(address => string) public pubKey;
```

- `numEntries`: Tracks the number of entries per address
- `entries`: Stores encrypted credential blobs as base64 strings
- `pubKey`: Stores public keys for PGP encryption

### Functions

#### `storeEntry(string memory entry)`
- Stores an encrypted credential blob
- Append-only: always adds to array or overwrites at current index
- Increments `numEntries` counter
- **Gas Optimization**: Reuses array slots if available

#### `getEntry(address account, uint256 n)`
- Retrieves a single entry by index
- Returns empty string if index out of bounds
- Public view function

#### `getEntries(address account, uint256 startFrom, uint256 limit)`
- Retrieves multiple entries with pagination
- Returns array of encrypted strings
- Useful for fetching all entries in batches

#### `resetEntries()`
- Resets the entry counter to 0
- **Note**: Does not clear the array, only resets counter
- **Issue**: May cause confusion if entries array still contains data

#### `storePubkey(string memory pubkey)`
- Stores a public key for the message sender
- Used for PGP encryption/decryption features
- Overwrites previous public key if exists

## Data Format

### Stored Entry Format
- Base64-encoded string
- Format: `{iv}{ciphertext}`
- IV: First 16 characters (base64-encoded 12-byte IV)
- Ciphertext: Remaining characters (base64-encoded encrypted data)

### Entry Content
Each entry contains:
- MessagePack-serialized array of shortened credentials
- Encrypted with AES-GCM
- Multiple credentials bundled per entry

## Deployment

### Networks
- **Astar Mainnet**: Production deployment
- **Localhost**: Development (Hardhat/Anvil)
- **Shibuya**: Testnet (deployment only, not used in frontend)

### Deployment Process
```bash
cd contract
bun run local:node      # Start local blockchain
bun run local:deploy    # Deploy contract
```

Uses Hardhat Ignition for deployment management.

## Gas Considerations

### Current Implementation
- String storage is expensive on Ethereum-compatible chains
- No pagination limits on `getEntries` (could be expensive for large datasets)
- `resetEntries()` doesn't clear array (wasted storage)

### Optimization Opportunities
1. Add pagination limits to prevent gas issues
2. Implement proper array clearing in `resetEntries()`
3. Consider events for off-chain indexing
4. Batch operations for multiple entries

## Security Model

### Access Control
- All functions use `msg.sender` for address-based access
- No admin functions or upgradeability
- Immutable contract (no proxy pattern)

### Data Privacy
- Only encrypted blobs stored on-chain
- No plaintext data ever stored
- Public keys stored for PGP features

### Audit Trail
- Append-only model provides complete history
- All changes are immutable
- Can reconstruct full credential history

## Testing

### Test File
- Location: `/contract/test/Keyvault.ts`
- Framework: Hardhat + Chai
- Coverage: Basic functionality tests

### Test Cases
- Store and retrieve single entry
- Store and retrieve multiple entries
- Store and retrieve public key

### Missing Tests
- Edge cases (empty arrays, large data)
- Gas optimization scenarios
- Pagination edge cases
- `resetEntries()` behavior with existing data

