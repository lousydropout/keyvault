# Task Breakdown: Base Chain Deployment and Multi-Chain Support

## Overview
Total Tasks: 28 (22 complete, 6 remaining)

**Implementation Status:** Core multi-chain functionality complete on branch `claude/base-chain-deployment-cH0od`. Task Groups 1 (partial), 2, 3, 4, 5, 6, 7 complete. Remaining work: Base mainnet deployment (blocked on credentials) and final test review.

## Task List

### Phase 1: Core Multi-Chain Support

#### Task Group 1: Contract Deployment and Configuration
**Dependencies:** None
**Specialization:** Smart Contract / DevOps

- [x] 1.0 Complete chain configuration infrastructure (ALREADY DONE)
  - [x] 1.1 Create ChainConfig type and CHAIN_CONFIGS registry
    - File: `browser-extension/src/constants/chains.ts`
    - Defines chain, address, apiUrl, dappUrl, name per chain
  - [x] 1.2 Add helper functions (getChainConfig, isValidChainId)
  - [x] 1.3 Configure Hardhat for Base networks
    - File: `contract/hardhat.config.ts`
    - Add base and baseSepolia network configurations
  - [x] 1.4 Mirror chain config in frontend
    - File: `frontend/src/chainConfig.ts`

- [ ] 2.0 Deploy and verify contract on Base mainnet
  - [x] 2.1 Write 2-4 deployment verification tests
    - Test contract deployment to local Hardhat node
    - Test contract interaction (addCredential, getCredentials)
    - Verify Hardhat Ignition module works correctly
    - **COMPLETED**: Created `contract/test/Deployment.ts` with 5 passing tests
  - [x] 2.2 Deploy to local Hardhat network for testing
    - Run `cd contract && bun run local:node` to start Anvil
    - Deploy using `bun run local:deploy`
    - Verify contract address matches localKeyvaultAddress
    - **COMPLETED**: Deployed to `0x5FbDB2315678afecb367f032d93F642f64180aa3`, matches localKeyvaultAddress
    - All 5 deployment tests pass against localhost
  - [ ] 2.3 Test extension against localhost deployment
    - Enable dev mode in extension settings
    - Switch to Localhost chain
    - Verify credential storage and retrieval works
    - **REQUIRES**: Manual browser testing
  - [ ] 2.4 Deploy to Base mainnet using Hardhat Ignition
    - Run `npx hardhat ignition deploy ignition/modules/Keyvault.ts --network base`
    - Record deployed contract address
    - Save deployment artifacts
    - **REQUIRES**: PRIVATE_KEY set via `npx hardhat vars set PRIVATE_KEY` with funded wallet
  - [ ] 2.5 Verify contract on Basescan
    - Use existing etherscan verification config
    - Run `npx hardhat verify --network base <CONTRACT_ADDRESS>`
    - **REQUIRES**: BASESCAN_API_KEY environment variable
  - [ ] 2.6 Update Base contract address in configurations
    - Replace `"0x_YOUR_BASE_ADDRESS_HERE"` in `browser-extension/src/constants/chains.ts`
    - Update `frontend/src/chainConfig.ts` with same address
    - **BLOCKED BY**: Task 2.4 (need deployed address)
  - [ ] 2.7 Run deployment verification tests
    - Execute tests from 2.1 against Base mainnet
    - Verify contract responds correctly
    - **BLOCKED BY**: Task 2.4 (need deployed contract)

**Acceptance Criteria:**
- Contract deployed to Base mainnet
- Contract verified on Basescan
- Contract address updated in both browser-extension and frontend configs
- Deployment tests pass against both localhost and Base mainnet

---

#### Task Group 2: Default Chain Configuration Fix
**Dependencies:** None (can run in parallel with Task Group 1)
**Specialization:** Frontend Configuration

- [x] 3.0 Fix default chain configuration
  - [x] 3.1 Write 2-3 focused tests for default chain behavior
    - Test DEFAULT_CHAIN_ID equals astar.id
    - Test fallback to default when stored chainId is invalid
    - Test existing users remain on Astar
  - [x] 3.2 Update DEFAULT_CHAIN_ID in browser-extension
    - File: `browser-extension/src/constants/chains.ts`
    - Change line 38 from `hardhat.id` to `astar.id`
  - [x] 3.3 Verify frontend already has correct default
    - File: `frontend/src/chainConfig.ts`
    - Confirm DEFAULT_CHAIN_ID is already `astar.id`
  - [x] 3.4 Run default chain tests
    - Execute tests from 3.1
    - Verify new users default to Astar

**Acceptance Criteria:**
- DEFAULT_CHAIN_ID is `astar.id` in browser-extension
- New installations default to Astar chain
- Invalid stored chainIds fall back to Astar
- Tests from 3.1 pass

---

#### Task Group 3: UI Components (ALREADY COMPLETE)
**Dependencies:** None
**Specialization:** Frontend UI
**Status:** COMPLETE - Already implemented on branch

- [x] 4.0 Chain selector UI (ALREADY DONE)
  - [x] 4.1 Create ChainSelector component with Select dropdown
    - File: `browser-extension/src/components/ChainSelector.tsx`
  - [x] 4.2 Implement AlertDialog confirmation for unsaved data
  - [x] 4.3 Filter localhost unless devMode enabled
  - [x] 4.4 Integrate ChainSelector into header layout

- [x] 5.0 Developer mode toggle (ALREADY DONE)
  - [x] 5.1 Add devMode Switch toggle to Settings page
    - File: `browser-extension/src/side_panel/settings.tsx`
  - [x] 5.2 Store devMode in browser local storage
  - [x] 5.3 Connect devMode to ChainSelector localhost visibility

- [x] 6.0 Chain switching logic (ALREADY DONE)
  - [x] 6.1 Create useChain hook with switchChain function
    - File: `browser-extension/src/side_panel/chain.ts`
  - [x] 6.2 Implement chain persistence in browser storage
  - [x] 6.3 Clear credentials on chain switch
  - [x] 6.4 Memoize client and contract for current chain

**Acceptance Criteria:** (VERIFIED COMPLETE)
- ChainSelector displays in extension header
- Confirmation dialog shows when switching with unsaved data
- Developer mode toggle controls localhost visibility
- Chain selection persists across sessions

---

#### Task Group 4: Empty State Message
**Dependencies:** Task Group 3 (uses existing ChainSelector infrastructure)
**Specialization:** Frontend UI
**Status:** COMPLETE

- [x] 7.0 Add empty state message for chain-specific credentials
  - [x] 7.1 Write 2-3 focused tests for empty state display
    - Test message shows when credentials array is empty after chain switch
    - Test message includes current chain name
    - Test message does not show during initial loading
    - **COMPLETED**: Created `browser-extension/src/components/EmptyChainState.test.tsx` with 5 passing tests
  - [x] 7.2 Create EmptyChainState component
    - File: `browser-extension/src/components/EmptyChainState.tsx`
    - Display: "No credentials found on [Chain Name]."
    - Subtext: "Your credentials on other chains remain unchanged."
    - Use existing card/container styling patterns
  - [x] 7.3 Integrate EmptyChainState into credentials list view
    - Show when credentials.length === 0 AND not loading
    - Pass current chain name from useChain hook
    - Updated `browser-extension/src/side_panel/credentialsAll.tsx`
    - Updated `browser-extension/src/side_panel/currentPage.tsx`
    - Updated `browser-extension/src/side_panel/credentials.tsx`
  - [x] 7.4 Run empty state tests
    - Execute tests from 7.1
    - Verify message displays correctly
    - All 199 tests pass including the new empty state tests

**Acceptance Criteria:**
- Empty state message shows when switching to chain with no credentials
- Message clearly indicates credentials are chain-specific
- Message includes current chain name
- Tests from 7.1 pass

---

#### Task Group 5: Multi-Chain Account Discovery
**Dependencies:** Task Group 1 (chain configuration), Task Group 3 (useChain hook)
**Specialization:** Frontend Logic
**Status:** COMPLETE

- [x] 11.0 Implement multi-chain account discovery on login
  - [x] 11.1 Write 3-4 focused tests for account discovery
    - Test discovery finds account on single chain
    - Test discovery finds accounts on multiple chains
    - Test discovery returns empty when no accounts exist
    - Test discovery handles chain query failures gracefully
    - **COMPLETED**: Created `browser-extension/src/utils/discoverAccounts.test.ts` with 14 passing tests
  - [x] 11.2 Create discoverAccounts utility function
    - File: `browser-extension/src/utils/discoverAccounts.ts`
    - Function: `discoverAccounts(pubkey: Hex): Promise<DiscoveryResult>`
    - Query `numEntries` on ALL supported chains in parallel using Promise.allSettled
    - Return DiscoveryResult with accounts, allChains status, and errors arrays
    - Handle individual chain failures without blocking others
  - [x] 11.3 Update encryptionKeySetup to use multi-chain discovery
    - File: `browser-extension/src/side_panel/encryptionKeySetup.tsx`
    - Complete rewrite (385 lines) to use `discoverAccounts()`
    - If found on 1 chain: auto-select that chain, show "Using [ChainName]"
    - If found on multiple chains: show chain selection UI with click-to-select
    - If found on none: show "No account detected" (existing behavior)
  - [x] 11.4 Create chain selection UI for multi-chain accounts
    - Shows all chains with status icons (green checkmark/red X/yellow warning)
    - Display chain name and credential count for each
    - Click any chain with accounts to select (highlighted with green border)
    - Updates stored chainId and numEntries on selection
  - [x] 11.5 Run account discovery tests
    - All 14 discovery tests pass
    - All 252 browser-extension tests pass

**Acceptance Criteria:**
- Login discovers accounts on ALL supported chains, not just default
- Users with accounts on non-default chains can log in successfully
- Multi-chain users can select which chain to use
- Chain query failures don't block discovery on other chains
- Tests from 11.1 pass

---

### Phase 2: Fast-Follow Features (Not Blocking Initial Release)

#### Task Group 6: CSV Export Feature
**Dependencies:** Task Groups 1-5 complete (core functionality working)
**Specialization:** Frontend Logic
**Status:** COMPLETE

- [x] 8.0 Implement CSV export functionality
  - [x] 8.1 Write 3-4 focused tests for CSV export
    - Test CSV format matches "name,url,username,password,note"
    - Test proper escaping of special characters (quotes, commas)
    - Test encrypted export produces encrypted file
    - Test unencrypted export produces plaintext CSV
    - **COMPLETED**: Created `browser-extension/src/utils/csv.test.ts` with 18 passing tests
  - [x] 8.2 Create CSV formatting utility
    - File: `browser-extension/src/utils/csv.ts`
    - Function: `credentialsToCSV(credentials: Credential[]): string`
    - Handle proper CSV escaping (RFC 4180 compliant)
    - Columns: name, url, username, password, note
  - [x] 8.3 Add encrypted CSV export function
    - Encrypt CSV content using existing encryption utilities
    - Maintain compatibility with existing encrypted export pattern
    - Functions: `encryptCSV()` and `credentialsToEncryptedCSV()`
  - [x] 8.4 Add export buttons to Settings page
    - Augmented existing JSON export buttons with CSV section
    - "Export as CSV" - unencrypted plaintext CSV download
    - "Export as Encrypted CSV" - encrypted JSON download
    - Trigger browser download with appropriate filename (keyvault_credentials_YYYY-MM-DD.csv)
  - [x] 8.5 Run CSV export tests
    - Execute tests from 8.1
    - All 18 tests pass
    - Verified Chrome password manager import compatibility via format testing

**Acceptance Criteria:**
- CSV export produces Chrome password manager compatible format
- Both encrypted and unencrypted export options work
- Special characters properly escaped
- Tests from 8.1 pass

---

#### Task Group 7: CSV Import Feature
**Dependencies:** Task Group 6 (uses CSV utilities)
**Specialization:** Frontend Logic
**Status:** COMPLETE

- [x] 9.0 Implement CSV import functionality
  - [x] 9.1 Write 4-5 focused tests for CSV import
    - Test parsing valid CSV format
    - Test encrypted CSV requires successful decryption
    - Test unencrypted CSV loads directly
    - Test invalid CSV format shows error
    - Test imported credentials merge with existing
    - **COMPLETED**: Extended `browser-extension/src/utils/csv.test.ts` with 21 new CSV import tests (total 39 tests)
  - [x] 9.2 Create CSV parsing utility
    - File: `browser-extension/src/utils/csv.ts` (extended existing)
    - Function: `parseCSV(content: string): CSVImportResult`
    - Function: `parseCSVRow(row: string): string[]`
    - Function: `validateCSVHeader(header: string): ValidationResult`
    - Handle quoted fields and escaped characters (RFC 4180 compliant)
    - Validate required columns present
  - [x] 9.3 Add encrypted CSV detection and decryption
    - Function: `isEncryptedCSV(content: string): boolean`
    - Function: `decryptAndParseCSV(cryptoKey, content): Promise<CSVImportResult>`
    - Detect if file is encrypted (check for JSON with iv and ciphertext)
    - If encrypted: decrypt and parse, verify success before proceeding
    - If unencrypted: parse directly
  - [x] 9.4 Create import UI in Settings page
    - File: `browser-extension/src/side_panel/settings.tsx`
    - Hidden file input for CSV/JSON selection
    - "Import from CSV" button
    - Show validation errors if import fails (red error box)
    - Confirm import success with credential count (green success box)
    - Shows skipped duplicate count
  - [x] 9.5 Handle import merge logic
    - Function: `mergeImportedCredentials(existing, imported): PasswordAdditionCred[]`
    - Add imported credentials to pending list (pendingCreds)
    - Mark as modified to trigger sync prompt (modifiedEncrypteds = true)
    - Do not overwrite existing credentials with same URL+username
  - [x] 9.6 Run CSV import tests
    - Execute tests from 9.1
    - All 39 tests pass (18 export + 21 import)
    - Test full import flow end-to-end

**Acceptance Criteria:**
- CSV import parses Chrome password manager export format
- Encrypted imports require successful decryption verification
- Unencrypted imports load directly
- Import errors display clearly to user
- Tests from 9.1 pass

---

### Testing

#### Task Group 8: Test Review and Integration Verification
**Dependencies:** Task Groups 1-7
**Specialization:** QA / Testing
**Status:** IN PROGRESS

- [ ] 10.0 Review and verify all feature tests
  - [x] 10.1 Review tests from all task groups
    - Deployment tests from 2.1: 5 tests (contract/test/Deployment.ts)
    - Default chain tests from 3.1: included in chains.test.ts
    - Empty state tests from 7.1: 5 tests (EmptyChainState.test.tsx)
    - CSV export/import tests: 39 tests (csv.test.ts)
    - Account discovery tests: 14 tests (discoverAccounts.test.ts)
    - **VERIFIED**: All feature tests pass (252 browser-extension + 73 frontend = 325 total)
  - [ ] 10.2 Identify critical gaps in end-to-end flows
    - Focus on cross-component integration
    - Test chain switching with real contract interaction
    - Test full export/import cycle across chains
    - **REQUIRES**: Manual browser testing
  - [ ] 10.3 Write up to 5 additional integration tests if needed
    - End-to-end: Switch chain, add credential, sync, switch back
    - End-to-end: Export from Astar, import to Base
    - Chain mismatch warning in frontend
  - [x] 10.4 Run all feature-specific tests
    - `bun run test` from root runs both browser-extension and frontend suites
    - Browser-extension: 252 pass, 0 fail
    - Frontend: 73 pass, 0 fail
    - **VERIFIED**: All tests pass

**Acceptance Criteria:**
- All feature-specific tests pass ✅
- End-to-end workflows verified (pending manual testing)
- No more than 5 additional tests added
- Total test count under 25 per task group

---

## Execution Order

### Recommended Implementation Sequence

**Parallel Phase A (Can run simultaneously):**
1. Task Group 1: Contract Deployment (2.0) - Smart contract engineer
2. Task Group 2: Default Chain Fix (3.0) - Frontend developer

**Sequential Phase B (After Phase A):**
3. Task Group 4: Empty State Message (7.0) - Requires chain infrastructure
4. Task Group 5: Multi-Chain Account Discovery (11.0) - Critical for multi-chain login

**Phase C: Fast-Follow (After Phase B verified working):**
5. Task Group 6: CSV Export (8.0)
6. Task Group 7: CSV Import (9.0)

**Final Phase:**
7. Task Group 8: Test Review (10.0)

### Already Complete (No Action Required)
- Task Group 3: UI Components (ChainSelector, devMode toggle, useChain hook)

---

## Key Files Reference

### Files to Modify
| File | Changes |
|------|---------|
| `browser-extension/src/constants/chains.ts` | Update DEFAULT_CHAIN_ID, add Base contract address |
| `frontend/src/chainConfig.ts` | Add Base contract address |
| `browser-extension/src/side_panel/settings.tsx` | Add CSV export/import buttons |

### Files to Create
| File | Purpose |
|------|---------|
| `browser-extension/src/components/EmptyChainState.tsx` | Empty state message component |
| `browser-extension/src/utils/csv.ts` | CSV formatting and parsing utilities |
| `browser-extension/src/utils/discoverAccounts.ts` | Multi-chain account discovery utility |

### Existing Files (Reference Only)
| File | Purpose |
|------|---------|
| `browser-extension/src/components/ChainSelector.tsx` | Chain dropdown (already complete) |
| `browser-extension/src/side_panel/chain.ts` | useChain hook (already complete) |
| `contract/hardhat.config.ts` | Base network configuration (already complete) |

---

## Risk Mitigation

1. **Contract Deployment Risk:** Test thoroughly on localhost before mainnet deployment. Keep deployment transaction hash for verification.

2. **Existing User Impact:** Default chain change to Astar ensures existing users are unaffected. Migration from hardhat default handles gracefully via isValidChainId fallback.

3. **CSV Format Compatibility:** Test import/export with actual Chrome password manager exports to ensure format compatibility.
