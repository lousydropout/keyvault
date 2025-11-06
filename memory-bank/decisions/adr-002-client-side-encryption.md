# ADR-002: Client-Side Encryption

## Status
Accepted

## Context
Keyvault needs to store sensitive credential data (passwords, private keys) on a public blockchain. We must ensure that:
- Plaintext data never appears on-chain
- Users maintain control over their encryption keys
- No trusted third party is required
- Encryption is performant for web applications

## Decision
We will implement **client-side encryption** using:
1. **AES-GCM** (256-bit) for encryption/decryption
2. **Web Crypto API** for all cryptographic operations
3. **PBKDF2** (1,000,000 iterations, SHA-512) for key derivation
4. Encryption happens in browser extension before blockchain submission
5. Encryption keys stored locally in browser storage (JWK format)

## Consequences

### Positive
- ✅ **Privacy**: Plaintext never leaves user's device
- ✅ **User Control**: Users own their encryption keys
- ✅ **No Trust Required**: No third-party key management
- ✅ **Performance**: Web Crypto API is hardware-accelerated
- ✅ **Standards**: Uses industry-standard algorithms

### Negative
- ⚠️ **Key Management**: Users responsible for key backup
- ⚠️ **Key Loss**: Lost key means lost data (no recovery)
- ⚠️ **Browser Storage**: Keys stored in browser (potential security concern)

### Mitigations
1. **Key Export**: Users can export encryption keys for backup
2. **Key Wrapping**: Optional password-based key wrapping for additional security
3. **Browser Security**: Rely on browser's security model for storage protection

## Implementation Details

### Encryption Algorithm: AES-GCM
- **Key Size**: 256 bits
- **IV Size**: 12 bytes (96 bits)
- **Tag Length**: 128 bits
- **Rationale**: Provides both confidentiality and integrity

### Key Derivation: PBKDF2
- **Iterations**: 1,000,000 (high iteration count for security)
- **Hash**: SHA-512
- **Salt**: 16 random bytes per key wrap
- **Output**: AES-KW key for wrapping/unwrapping

### Key Storage
- Format: JSON Web Key (JWK)
- Location: `chrome.storage.local`
- Key: `"jwk"`
- Exportable: Yes (via settings UI)

### Encryption Process
1. Credentials shortened to arrays
2. Arrays bundled and serialized with MessagePack
3. Serialized data encrypted with AES-GCM
4. IV and ciphertext concatenated as base64 string
5. String stored on blockchain

## Alternatives Considered

### 1. Server-Side Encryption
- **Rejected**: Requires trusted third party
- **Issue**: Defeats purpose of decentralized storage

### 2. Hybrid Encryption (RSA + AES)
- **Rejected**: More complex, not needed for current use case
- **Issue**: RSA slower, larger key sizes

### 3. End-to-End Encryption with Public Keys
- **Partially Adopted**: Used for PGP message encryption
- **Not Used**: For credential storage (would require key exchange)

## Security Considerations

### Threat Model
- ✅ **Blockchain Data Leakage**: Protected (all data encrypted)
- ✅ **Network Interception**: Protected (encryption client-side)
- ✅ **Smart Contract Bugs**: Protected (only encrypted blobs stored)
- ⚠️ **Key Theft**: User must protect browser/device
- ⚠️ **Key Loss**: User must backup keys

### Key Management Best Practices
1. Export and securely backup encryption keys
2. Use strong password if using key wrapping
3. Protect device/browser from malware
4. Consider hardware wallet integration (future)

## Related Decisions
- ADR-001: Append-Only Storage Model
- Encryption Implementation: `browser-extension/src/utils/encryption.ts`

## References
- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- AES-GCM: NIST SP 800-38D
- PBKDF2: RFC 2898

