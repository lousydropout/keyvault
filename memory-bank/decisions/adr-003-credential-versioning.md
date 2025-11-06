# ADR-003: Credential Versioning System

## Status
Accepted

## Context
Keyvault needs to support credential updates while maintaining history. We need a system that:
- Tracks all changes to credentials
- Allows reconstruction of credential history
- Efficiently identifies the "current" version
- Works with append-only storage model

## Decision
We will implement a **credential versioning system** using:
1. **Unique IDs**: Each credential has a constant `id` (32-bit random number)
2. **Timestamps**: Each version has a unique `timestamp` (milliseconds since epoch)
3. **Credential Chains**: All versions with the same `id` form a chronological chain
4. **Latest Version**: The version with the highest `timestamp` is the current state
5. **Deletion Markers**: Deletions are special versions with `isDeleted: true`

## Consequences

### Positive
- ✅ **Complete History**: Full audit trail of all changes
- ✅ **Efficient Lookup**: Can find current version by sorting chain
- ✅ **Undo Capability**: Previous versions always available
- ✅ **Consistent Identity**: Same `id` across all versions
- ✅ **Simple Logic**: Easy to implement and understand

### Negative
- ⚠️ **Storage Overhead**: All versions stored (mitigated by bundling)
- ⚠️ **Processing Overhead**: Must process chains to find current state
- ⚠️ **ID Collisions**: 32-bit IDs have collision risk (very low)

### Mitigations
1. **Bundling**: Multiple credentials per transaction reduces overhead
2. **Client-Side Caching**: Extension caches current state
3. **ID Generation**: Uses `crypto.getRandomValues()` for strong randomness

## Implementation Details

### ID Generation
```typescript
export const generateId = (): number => {
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  return randomValues[0];
};
```

### Credential Structure
```typescript
type BaseCred = {
  version: number;      // Schema version (currently 1)
  id: number;          // Unique ID (constant across versions)
  type: number;         // Credential type (0-3)
  timestamp: number;    // Creation/update timestamp
};
```

### Update Process
1. User edits credential
2. System creates new credential object with:
   - Same `id` as original
   - New `timestamp` (current time)
   - Updated fields
3. New version stored as pending
4. Sync creates new on-chain entry
5. Both versions exist in chain

### Deletion Process
1. User deletes credential
2. System creates deletion record with:
   - Same `id` as original
   - `isDeleted: true`
   - Only `url` field preserved
   - New `timestamp`
3. Deletion record stored on-chain
4. UI filters out deleted credentials

### Chain Reconstruction
```typescript
// Group by ID
const chains: Record<string, Cred[]> = {};
for (const cred of credentials) {
  const id = cred.id.toString(16);
  if (!chains[id]) chains[id] = [];
  chains[id].push(cred);
}

// Sort each chain by timestamp
for (const id in chains) {
  chains[id].sort((a, b) => a.timestamp - b.timestamp);
}

// Get latest non-deleted version
const latest = chains[id][chains[id].length - 1];
if (!latest.isDeleted) {
  // This is the current version
}
```

## Example Credential Chain

```
Credential ID: 0x56f22adc

Chain:
  v1: { id: 0x56f22adc, timestamp: 1000, password: "old123", isDeleted: false }
  v2: { id: 0x56f22adc, timestamp: 2000, password: "new456", isDeleted: false }
  v3: { id: 0x56f22adc, timestamp: 3000, isDeleted: true, url: "https://example.com" }
  
Current State: v2 (latest non-deleted)
```

## Alternatives Considered

### 1. Incremental Version Numbers
- **Rejected**: Requires coordination between devices
- **Issue**: Race conditions when syncing

### 2. Hash-Based Versioning
- **Rejected**: More complex, not needed
- **Issue**: Harder to sort chronologically

### 3. Separate Update Records
- **Rejected**: Would require linking mechanism
- **Issue**: More complex data structure

## Related Decisions
- ADR-001: Append-Only Storage Model
- Credential Types: `browser-extension/src/utils/credentials.ts`

## References
- Implementation: `browser-extension/src/utils/credentials.ts`
- Chain Reconstruction: `getCredsByUrl()` function

