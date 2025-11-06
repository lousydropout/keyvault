# Data Structures and API Contracts

## Credential Types

### BaseCred
```typescript
type BaseCred = {
  version: number;      // Current version (1)
  id: number;          // Unique identifier (32-bit)
  type: number;        // Credential type (0-3)
  timestamp: number;    // Unix timestamp in milliseconds
};
```

### PasswordCred

#### PasswordAdditionCred
```typescript
type PasswordAdditionCred = BaseCred & {
  type: 0;
  isDeleted: false;
  url: string;
  username: string;
  password: string;
  description: string;
};
```

#### PasswordDeletionCred
```typescript
type PasswordDeletionCred = BaseCred & {
  type: 0;
  isDeleted: true;
  url: string;
};
```

#### PasswordCred Union
```typescript
type PasswordCred = PasswordAdditionCred | PasswordDeletionCred;
```

### KeypairCred
```typescript
type KeypairCred = BaseCred & {
  type: 1;
  publicKey: string;
  privateKey: string;
};
```

### SecretShareCred
```typescript
type SecretShareCred = BaseCred & {
  type: 2;
  share: string;
  for: string;
  secretTitle: string;
  additionalInfo: string;
};
```

### ContactCred
```typescript
type ContactCred = BaseCred & {
  type: 3;
  name: string;
  address: string;
  method: string;
  additionalInfo: string;
};
```

### Cred Union Type
```typescript
type Cred = PasswordCred | KeypairCred | SecretShareCred | ContactCred;
```

## Encryption Data Structures

### Encrypted
```typescript
type Encrypted = {
  iv: string;          // Base64-encoded IV (12 bytes)
  ciphertext: string;  // Base64-encoded encrypted data
};
```

### Keys
```typescript
type Keys = {
  key: CryptoKey;      // Web Crypto API key object
  wrappedKey: string;  // Base64-encoded wrapped key (optional)
};
```

## Storage Data Structures

### CredsByUrl
```typescript
type CredsByUrl = Record<string, PasswordCred[][]>;
// Maps URL to array of credential chains
// Each chain is an array of PasswordCred sorted by timestamp
```

### CredsMapping
```typescript
type CredsMapping = Record<string, [string, number]>;
// Maps credential ID to [url, chainIndex]
```

### Unencrypted
```typescript
type Unencrypted = {
  passwords: PasswordCred[];
  keypairs: KeypairCred[];
};
```

## Smart Contract Interface

### Keyvault ABI Functions

#### storeEntry
```solidity
function storeEntry(string memory entry) public
```
- **Input**: Base64 string containing `{iv}{ciphertext}`
- **Effect**: Appends entry to `entries[msg.sender]` array
- **Returns**: None

#### getEntry
```solidity
function getEntry(address account, uint256 n) public view returns (string memory)
```
- **Input**: Account address, entry index
- **Returns**: Encrypted entry string or empty string if out of bounds

#### getEntries
```solidity
function getEntries(address account, uint256 startFrom, uint256 limit) 
  public view returns (string[] memory)
```
- **Input**: Account address, start index, limit
- **Returns**: Array of encrypted entry strings

#### storePubkey
```solidity
function storePubkey(string memory pubkey) public
```
- **Input**: Public key string (PGP armored format)
- **Effect**: Stores public key for `msg.sender`

#### numEntries
```solidity
mapping(address => uint256) public numEntries
```
- **Returns**: Number of entries for given address

#### pubKey
```solidity
mapping(address => string) public pubKey
```
- **Returns**: Public key for given address

## Message Formats

### Extension → Frontend (postMessage)
```typescript
{
  type: "FROM_EXTENSION",
  data: {
    encrypted: Encrypted;
    address: string;      // Wallet address
    numEntries: number;   // Current entry count
    overwrite: boolean;   // Whether to overwrite
    chainId: number;      // Chain ID for validation
  }
}
```

### Frontend → Extension (postMessage)
```typescript
{
  type: "TO_EXTENSION",
  key: string;           // Storage key
  value: any;            // Value to store
}
```

### Content Script → Extension
```typescript
{
  type: "FROM_EXTENSION",
  action: "fillCredentials",
  username: string;
  password: string;
}
```

## Key Index Arrays

### passwordIndex
```typescript
const passwordIndex = [
  "version", "type", "id", "timestamp",
  "isDeleted", "url", "username", "password", "description"
];
```

### keypairIndex
```typescript
const keypairIndex = [
  "version", "type", "id", "timestamp",
  "publicKey", "privateKey"
];
```

### secretShareIndex
```typescript
const secretShareIndex = [
  "version", "type", "id", "timestamp",
  "share", "for", "secretTitle", "additionalInfo"
];
```

### contactIndex
```typescript
const contactIndex = [
  "version", "type", "id", "timestamp",
  "name", "address", "method", "additionalInfo"
];
```

## Storage Keys (Chrome Storage)

- `jwk`: JsonWebKey - Encryption key
- `pubkey`: string - Wallet address
- `pendingCreds`: Cred[] - Pending credentials
- `encrypteds`: Encrypted[] - Encrypted entries from blockchain
- `credentials`: Cred[] - Decrypted credentials
- `credsByUrl`: CredsByUrl - Credentials organized by URL
- `numEntries`: number - Number of entries on-chain
- `tabIds`: number[] - Active tab IDs

## Serialization Format

### MessagePack
- Used for serializing credential arrays before encryption
- More efficient than JSON for binary data
- Preserves array structure and types

### Base64 Encoding
- IV and ciphertext encoded as base64 strings
- Stored as concatenated string: `{iv}{ciphertext}`
- IV is 16 characters (base64 of 12 bytes)
- Ciphertext follows immediately after

## Data Flow Formats

### Encryption Input
```typescript
Cred[] → shorten() → any[][] → msgpackEncode() → ArrayBuffer → encrypt() → Encrypted
```

### Decryption Output
```typescript
Encrypted → decrypt() → ArrayBuffer → msgpackDecode() → any[][] → recover() → Cred[]
```

### On-Chain Storage Format
```
Base64(IV) + Base64(Ciphertext) = string stored in contract
```

