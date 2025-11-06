# Credential Lifecycle Workflow

## Overview

This document describes the complete lifecycle of a credential from creation to deletion in the Keyvault system.

## Credential Structure

### Base Credential Fields
```typescript
{
  version: number,      // Current version (1)
  type: number,         // Credential type (0-3)
  id: number,           // Unique identifier (constant across versions)
  timestamp: number     // Creation/update timestamp
}
```

### Credential Types
- **Type 0**: Password credentials
- **Type 1**: Keypair credentials
- **Type 2**: Secret share credentials
- **Type 3**: Contact credentials

## Lifecycle Stages

### 1. Creation

**Process**:
1. User fills in credential form (URL, username, password, description)
2. Extension calls `createNewPasswordCred(params)`
3. System generates unique `id` using `crypto.getRandomValues()`
4. Sets `timestamp` to current time
5. Credential stored in local storage as "pending"

**Code Path**:
```
addCred.tsx → createNewPasswordCred() → Local Storage (pendingCreds)
```

**Key Functions**:
- `generateId()`: Creates random 32-bit ID
- `createNewPasswordCred()`: Creates new credential object

### 2. Local Storage (Pending)

**State**: Credential exists only in browser extension
- Stored in `chrome.storage.local` as `pendingCreds` array
- Not yet encrypted or sent to blockchain
- Can be edited or deleted locally

**Operations Available**:
- Edit credential
- Delete credential
- Sync to blockchain

### 3. Encryption

**Process**:
1. User clicks "Send data to dApp" in sync panel
2. Extension collects all pending credentials
3. Calls `encryptEntries(cryptoKey, pendingCreds)`
4. Each credential is shortened (object → array)
5. Shortened credentials bundled into array
6. Array serialized with MessagePack
7. Serialized data encrypted with AES-GCM
8. IV and ciphertext concatenated as base64 string

**Code Path**:
```
sync.tsx → encryptEntries() → encryption.ts → Encrypted object
```

**Key Functions**:
- `encryptEntries()`: Encrypts credential array
- `encrypt()`: AES-GCM encryption with unique IV
- `createKeyShortener()`: Converts objects to compact arrays

### 4. Blockchain Submission

**Process**:
1. Extension sends encrypted data to frontend via `postMessage`
2. Frontend validates wallet address and chain ID match
3. User approves transaction in wallet
4. Frontend calls `storeEntry(encryptedString)` on smart contract
5. Smart contract stores encrypted blob in append-only array
6. Transaction confirmed on blockchain

**Code Path**:
```
Extension → postMessage → Frontend App.tsx → writeContract() → Blockchain
```

**Validation**:
- Wallet address must match extension's stored address
- Chain ID must match configured network
- Transaction must succeed

### 5. On-Chain Storage

**State**: Credential encrypted and stored on blockchain
- Immutable record in smart contract
- Can be retrieved by any client
- Part of append-only history

**Storage Format**:
- Base64 string: `{iv}{ciphertext}`
- Stored in `entries[address][index]`
- Index tracked by `numEntries[address]`

### 6. Retrieval and Decryption

**Process**:
1. Extension calls `getEntries(address, 0, numEntries)` on contract
2. Receives array of encrypted strings
3. For each encrypted string:
   - Parses IV and ciphertext
   - Decrypts using stored encryption key
   - Deserializes MessagePack data
   - Reconstructs credential objects from arrays
4. Credentials organized by URL and ID

**Code Path**:
```
getEntries.ts → Smart Contract → decryptEntry() → credentials.ts → UI
```

**Key Functions**:
- `getEntries()`: Fetches from smart contract
- `decryptEntry()`: Decrypts single encrypted blob
- `decryptEntries()`: Decrypts array of blobs
- `decryptAndCategorizeEntries()`: Organizes decrypted credentials

### 7. Update

**Process**:
1. User edits existing credential
2. Extension calls `updatePasswordCred(cred, params)`
3. New credential created with:
   - Same `id` as original
   - New `timestamp`
   - Updated fields
4. New version stored as pending
5. Sync process creates new on-chain entry
6. Both versions exist in credential chain

**Key Functions**:
- `updatePasswordCred()`: Creates updated credential
- `updateWithNewPasswordCred()`: Updates credential mapping

**Credential Chain**:
- All versions share same `id`
- Sorted by `timestamp`
- Latest version is most recent

### 8. Deletion

**Process**:
1. User deletes credential
2. Extension calls `deletePasswordCred(cred)`
3. Creates deletion record:
   - Same `id` as original
   - `isDeleted: true`
   - Only `url` field preserved
   - New `timestamp`
4. Deletion record stored as pending
5. Sync process stores deletion on-chain
6. UI filters out deleted credentials

**Key Functions**:
- `deletePasswordCred()`: Creates deletion record
- `getCredsByUrl()`: Filters out deleted credentials

**Note**: Deletion is soft - original data remains on-chain but is marked as deleted.

## Credential Chains

### Concept
All versions of a credential with the same `id` form a "chain":
```
Credential Chain:
  [v1: timestamp=1, password="old"] 
  → [v2: timestamp=2, password="new"]
  → [v3: timestamp=3, isDeleted=true]
```

### Chain Reconstruction
1. All credentials with same `id` grouped together
2. Sorted by `timestamp` ascending
3. Latest non-deleted version is current state
4. Full history preserved

### Benefits
- Complete audit trail
- Can reconstruct any previous state
- No data loss
- Supports undo operations (in theory)

## State Synchronization

### Pending vs On-Chain
- **Pending**: Credentials not yet synced to blockchain
- **On-Chain**: Credentials stored on blockchain
- **Pruning**: Pending credentials are removed after successful sync

### Sync Process
1. Fetch current `numEntries` from contract
2. Compare with local count
3. If mismatch, fetch all entries and decrypt
4. Prune pending credentials that are now on-chain
5. Update local state

## Error Handling

### Encryption Failures
- Should be caught and logged
- User should be notified
- Credential remains in pending state

### Decryption Failures
- Invalid credentials filtered out
- Logged for debugging
- User may see reduced credential count

### Transaction Failures
- User notified via toast
- Retry option provided
- Credential remains in pending state

