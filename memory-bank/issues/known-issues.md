# Known Issues and Technical Debt

## Critical Issues

### 1. Smart Contract: `resetEntries()` Incomplete Implementation
**Location**: `contract/contracts/Keyvault.sol`

**Issue**: The `resetEntries()` function only resets the counter but doesn't clear the array, leading to:
- Stale data remaining in storage
- Wasted gas on subsequent writes
- Potential confusion about actual entry count

**Impact**: Medium - Affects gas efficiency and data consistency

**Recommendation**: 
- Remove `resetEntries()` if not needed, OR
- Implement proper array clearing, OR
- Add events to track resets

### 2. IV Parsing Vulnerability ✅ RESOLVED
**Location**: `browser-extension/src/utils/encryption.ts:228-252`

**Issue**: Hardcoded 16-character slice for IV assumes fixed base64 length without validation.

**Impact**: High - Could cause decryption failures with malformed data

**Status**: ✅ **RESOLVED** - Fixed with validation and error handling

**Resolution**:
- ✅ Added validation for IV length (exactly 16 base64 characters)
- ✅ Added error handling for malformed encrypted text
- ✅ Added descriptive error messages for all failure cases
- ✅ Added comprehensive unit tests (9 new tests, all passing)

### 3. Error Handling in Decryption
**Location**: `browser-extension/src/utils/credentials.ts:353-367`

**Issue**: Decryption failures may silently filter out invalid credentials without user feedback.

**Impact**: Medium - Users may lose credentials without knowing

**Recommendation**:
- Add try-catch around decryption operations
- Log decryption failures
- Provide user feedback when credentials cannot be decrypted

## High Priority Issues

### 4. Console Logging in Production
**Locations**: Multiple files in browser-extension

**Issue**: `console.log` statements throughout production code can:
- Expose sensitive information
- Impact performance
- Clutter browser console

**Files Affected**:
- `browser-extension/src/utils/openpgp.ts`
- `browser-extension/src/utils/getEntries.ts`
- `browser-extension/src/utils/credentials.ts`

**Recommendation**:
- Implement logging utility with levels
- Remove/guard console statements in production builds
- Use structured logging

### 5. Missing Error Boundaries
**Location**: Frontend React components

**Issue**: No React error boundaries, causing entire app to crash on errors.

**Impact**: Medium - Poor user experience

**Recommendation**:
- Add error boundaries around major components
- Implement graceful error handling
- Show user-friendly error messages

### 6. Public RPC Endpoint
**Location**: `frontend/src/config.ts:27`

**Issue**: Using public RPC endpoint may have rate limits or reliability issues.

**Recommendation**:
- Document RPC endpoint requirements
- Support environment variable configuration
- Consider fallback endpoints

## Medium Priority Issues

### 7. Limited Test Coverage
**Issue**: 
- Only basic unit tests exist
- No integration tests
- No end-to-end tests
- Smart contract tests are minimal

**Impact**: Medium - Risk of regressions

**Recommendation**:
- Expand unit test coverage
- Add integration tests for extension ↔ frontend communication
- Add smart contract edge case tests
- Consider E2E testing framework

### 8. Type Safety: `any` Usage
**Location**: `browser-extension/src/utils/credentials.ts:357`

**Issue**: Using `any[]` reduces type safety benefits of TypeScript.

**Recommendation**:
- Define proper types for decrypted data
- Remove `any` usage where possible
- Use type guards more extensively

### 9. Memory Management
**Issue**: Extension loads all credentials into memory, which may be problematic for large datasets.

**Impact**: Low-Medium - Performance degradation with many credentials

**Recommendation**:
- Implement pagination or lazy loading
- Consider indexed storage for large credential sets
- Add memory usage monitoring

### 10. Race Condition in Sync
**Location**: `browser-extension/src/side_panel/sync.tsx:64-79`

**Issue**: Multiple sync operations could cause race conditions.

**Recommendation**:
- Add request deduplication
- Implement proper state management for sync operations
- Add transaction status tracking

## Low Priority / Nice to Have

### 11. Documentation Gaps
- Missing inline documentation for complex functions
- No Architecture Decision Records (ADRs)
- Some complex algorithms lack explanation

**Recommendation**:
- Add JSDoc for all public functions
- Document credential chain algorithm
- Create ADRs for major design decisions

### 12. Dependency Management
**Issue**: 
- Using `"viem": "latest"` and `"wagmi": "latest"` in frontend
- Some dependencies may have security vulnerabilities

**Recommendation**:
- Pin dependency versions
- Regular security audits
- Use Dependabot or similar

### 13. Browser Compatibility
**Issue**: No explicit compatibility matrix or feature detection.

**Recommendation**:
- Document supported browser versions
- Add browser feature detection
- Consider Safari support if needed

## Security Considerations

### Key Storage
- Encryption keys stored in browser storage (JWK format)
- Consider hardware wallet integration for enhanced security
- Document key backup/recovery process clearly

### Extension Permissions
- Review manifest permissions for minimal access
- Ensure only necessary permissions requested

### Message Validation
- Validate all messages from content scripts
- Add origin validation for postMessage communications

## Performance Optimizations

### Potential Improvements
1. Implement pagination for large credential sets
2. Add caching strategy for blockchain reads
3. Optimize credential chain reconstruction
4. Batch smart contract reads where possible

## Technical Debt Summary

| Priority | Count | Status |
|----------|-------|--------|
| Critical | 2 | 1 resolved, 2 remaining |
| High | 3 | Should address soon |
| Medium | 4 | Plan for future |
| Low | 3 | Nice to have |

**Total Issues Tracked**: 13

