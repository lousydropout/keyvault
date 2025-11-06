# Encryption Security Model

## Overview

Keyvault uses client-side encryption to ensure that plaintext credentials never leave the user's device. All encryption/decryption operations occur in the browser extension using the Web Crypto API.

## Encryption Algorithm

### AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Key Size**: 256 bits
- **IV Size**: 12 bytes (96 bits)
- **Tag Length**: 128 bits
- **Rationale**: Provides both confidentiality and integrity protection

### Key Derivation

**PBKDF2** (Password-Based Key Derivation Function 2)
- **Iterations**: 1,000,000
- **Hash Function**: SHA-512
- **Salt**: 16 random bytes (generated per key wrap)
- **Output**: AES-KW (AES Key Wrap) key for wrapping/unwrapping the main encryption key

## Key Management

### Encryption Key Lifecycle

1. **Generation**: 
   - Random 256-bit AES-GCM key generated using `crypto.subtle.generateKey()`
   - Stored as JWK (JSON Web Key) in browser's local storage

2. **Storage**:
   - Key exported as JWK format
   - Stored in `chrome.storage.local` (browser extension)
   - Can be exported/downloaded by user for backup

3. **Usage**:
   - Key imported from JWK when needed
   - Used for encrypting/decrypting credential bundles
   - Never transmitted over network

### Key Wrapping (Optional)

Users can optionally wrap their encryption key with a password:
- Uses PBKDF2 to derive wrapping key from password
- Wraps the main encryption key using AES-KW
- Allows password-based key recovery

## Encryption Process

1. **Credential Preparation**:
   - Credentials converted to compact arrays (key shortening)
   - Multiple credentials bundled into single array
   - Serialized using MessagePack for efficiency

2. **Encryption**:
   - Generate unique 12-byte IV using `crypto.getRandomValues()`
   - Encrypt serialized data using AES-GCM
   - Concatenate IV (base64) + ciphertext (base64)
   - Result stored as string on blockchain

3. **Decryption**:
   - Parse IV and ciphertext from stored string
   - Decrypt using stored encryption key
   - Deserialize MessagePack data
   - Reconstruct credential objects from arrays

## Security Properties

### Confidentiality
- ✅ Plaintext credentials never stored on blockchain
- ✅ Encryption keys never transmitted
- ✅ Each encryption uses unique IV

### Integrity
- ✅ AES-GCM provides authentication tag
- ✅ Tampering detection on decryption
- ✅ Append-only blockchain storage prevents modification

### Availability
- ✅ Credentials stored on decentralized blockchain
- ✅ No single point of failure
- ✅ User controls encryption key (can backup)

## Threat Model

### Protected Against
- ✅ Blockchain data leakage (all data encrypted)
- ✅ Network interception (encryption happens client-side)
- ✅ Smart contract bugs (only encrypted blobs stored)
- ✅ Data modification (append-only + authentication tags)

### User Responsibilities
- ⚠️ Secure storage of encryption key backup
- ⚠️ Strong password if using key wrapping
- ⚠️ Secure wallet private key (for blockchain access)

## Known Security Considerations

1. **Key Storage**: Encryption keys stored in browser storage (JWK format)
   - Consider hardware wallet integration for enhanced security
   - Users should backup keys securely

2. **IV Parsing**: Current implementation assumes fixed IV length
   - Should validate IV length for robustness

3. **Error Handling**: Decryption failures should be handled gracefully
   - Currently may silently filter invalid credentials

