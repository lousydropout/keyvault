# ADR-001: Append-Only Storage Model

## Status
Accepted

## Context
Keyvault needs to store encrypted credentials on a blockchain smart contract. We need to decide on a storage model that:
- Prevents race conditions when syncing from multiple devices
- Provides an audit trail of all changes
- Ensures data consistency
- Minimizes gas costs

## Decision
We will use an **append-only storage model** where:
1. All credential changes are stored as new entries
2. Credentials are never modified or deleted from storage
3. Deletions are represented as special "deletion" records
4. The smart contract maintains an array of encrypted blobs per user

## Consequences

### Positive
- ✅ **No Race Conditions**: Multiple devices can write simultaneously without conflicts
- ✅ **Complete Audit Trail**: Full history of all credential changes
- ✅ **Data Consistency**: No risk of partial updates or lost data
- ✅ **Immutability**: Leverages blockchain's immutable nature
- ✅ **Simple Contract**: No complex update logic needed

### Negative
- ⚠️ **Storage Growth**: Storage grows indefinitely (mitigated by bundling)
- ⚠️ **Gas Costs**: Each change requires new transaction (mitigated by batching)
- ⚠️ **Reconstruction Overhead**: Must process all entries to find current state

### Mitigations
1. **Bundling**: Multiple credentials bundled per transaction to reduce gas costs
2. **Credential Chains**: Same `id` credentials form chains, only latest needed for current state
3. **Deletion Records**: Soft deletes prevent unnecessary storage of deleted credentials
4. **Client-Side Filtering**: Extension filters out deleted credentials in UI

## Implementation Details

### Smart Contract
```solidity
mapping(address => string[]) private entries;
mapping(address => uint256) public numEntries;
```

### Credential Versioning
- Each credential has unique `id` (constant across versions)
- Each version has unique `timestamp`
- Versions with same `id` form a "chain"
- Latest non-deleted version is current state

### Deletion Strategy
- Deletion creates new entry with `isDeleted: true`
- Original data remains but is filtered out in UI
- Allows for "undo" operations (in theory)

## Alternatives Considered

### 1. Update-in-Place Model
- **Rejected**: Would require complex locking mechanism
- **Issue**: Race conditions when syncing from multiple devices

### 2. Merkle Tree Model
- **Rejected**: Too complex for current use case
- **Issue**: Higher gas costs and implementation complexity

### 3. Event-Only Model
- **Rejected**: Events not queryable from client
- **Issue**: Would require external indexing service

## Related Decisions
- ADR-002: Credential Versioning System
- ADR-003: Bundling Strategy

## References
- Smart Contract: `contract/contracts/Keyvault.sol`
- Credential Types: `browser-extension/src/utils/credentials.ts`

