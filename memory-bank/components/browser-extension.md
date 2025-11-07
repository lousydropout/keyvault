# Browser Extension Component

## Overview

The browser extension is the core component that handles all encryption/decryption operations and provides the user interface for managing credentials.

## Technology Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Chrome storage API
- **Crypto**: Web Crypto API

## Key Directories

### `/src/side_panel/`
Main UI components for the extension side panel:
- `main.tsx` - Main entry point
- `credentials.tsx` - Credential list view
- `addCred.tsx` - Add new credential
- `editCred.tsx` - Edit existing credential
- `sync.tsx` - Sync credentials to blockchain
- `settings.tsx` - Settings and key management
- `encryptDecrypt.tsx` - PGP message encryption/decryption

### `/src/utils/`
Core utility functions:
- `encryption.ts` - AES-GCM encryption/decryption
- `credentials.ts` - Credential type definitions and operations
- `utility.ts` - Key shortening and data compression
- `getEntries.ts` - Fetch entries from smart contract
- `openpgp.ts` - PGP encryption for messages
- `shamir.ts` - Shamir's Secret Sharing

### `/src/hooks/`
Custom React hooks:
- `useCryptoKey.ts` - Encryption key management
- `useBrowserStore.ts` - Chrome storage wrapper
- `useCurrentTab.ts` - Current tab information

### `/src/scripts/`
Background scripts and content scripts:
- `background.chrome.ts` - Chrome background script
- `background.firefox.ts` - Firefox background script
- `contentScript.chrome.js` - Chrome content script
- `contentScript.firefox.js` - Firefox content script

## Key Features

### Credential Management
- Create, read, update, delete credentials
- Credential versioning with chains
- Support for multiple credential types:
  - Password credentials (type 0)
  - Keypair credentials (type 1)
  - Secret share credentials (type 2)
  - Contact credentials (type 3)

### Encryption
- AES-GCM encryption with 256-bit keys
- Key generation and storage
- Key export/import functionality
- Optional password-based key wrapping

### Blockchain Integration
- Fetches encrypted entries from smart contract
- Sends encrypted data to frontend for transaction submission
- Validates wallet address and chain ID

### Communication
- Uses `postMessage` API to communicate with frontend
- Content scripts for autofill functionality
- Background scripts for message routing

## Data Flow

1. **Credential Creation**:
   ```
   User Input → createNewPasswordCred() → Local Storage (pending)
   ```

2. **Sync to Blockchain**:
   ```
   Pending Creds → encryptEntries() → postMessage to Frontend → Transaction
   ```

3. **Credential Retrieval**:
   ```
   Smart Contract → getEntries() → decryptEntry() → Display in UI
   ```

## Storage

### Chrome Storage API
- `jwk` - Encryption key (JWK format)
- `pubkey` - Wallet address
- `pendingCreds` - Credentials not yet on-chain
- `encrypteds` - Encrypted entries from blockchain
- `credentials` - Decrypted credentials
- `credsByUrl` - Credentials organized by URL
- `numEntries` - Number of entries on-chain

## Build Configuration

- **Development**: `bun dev` (Chrome) or `bun dev:firefox`
- **Production**: `bun build` (Chrome) or `bun build-firefox`
- **Manifests**: Separate manifests for Chrome and Firefox in `/manifests/`

### Chrome Extension Build Requirements

Chrome extensions have specific requirements that differ from standard web applications:

#### 1. Asset Path Configuration
- **Issue**: Chrome extensions require relative paths for assets, not absolute paths
- **Solution**: Set `base: "./"` in `vite.config.ts` to generate relative paths
- **Impact**: Without this, the side panel HTML will fail to load assets (CSS, JS) with 404 errors

#### 2. Service Worker ES Module Limitations
- **Issue**: Chrome service workers (background.js) cannot use ES module `import` statements
- **Error**: "Cannot use import statement outside a module"
- **Solution**: Custom Vite plugin (`inlineImportsInBackground`) that:
  - Detects ES module imports in `background.js` after build
  - Inlines imported modules by reading the imported files
  - Wraps inlined code in an IIFE (Immediately Invoked Function Expression) to prevent variable name conflicts
  - Extracts only the needed exports via destructuring
- **Implementation**: Located in `vite.config.ts` - processes `dist/background.js` in the `writeBundle` hook

#### 3. Variable Name Conflicts
- **Issue**: When inlining modules, minified variable names can conflict (e.g., both logger and background script using `n`)
- **Solution**: IIFE wrapper scopes the inlined module's variables, preventing conflicts with the main script
- **Pattern**: 
  ```javascript
  const {exportedName: localName} = (function(){
    // inlined module code
    return {exportedName: internalVar};
  })();
  ```

#### 4. Build Output Format
- **Format**: ES modules for side panel (loaded in HTML context)
- **Format**: Inlined/bundled code for background.js and contentScript.js (no imports)
- **Note**: Cannot use `inlineDynamicImports: true` with multiple entry points in Rollup

### Build Process Flow

1. **TypeScript Compilation**: `tsc -p tsconfig.prod.json`
2. **Vite Build**: Bundles all entry points (side_panel, background, contentScript)
3. **Manifest Copy**: Copies appropriate manifest (Chrome/Firefox) to `dist/`
4. **Post-Processing** (Chrome only): `inlineImportsInBackground` plugin processes `background.js`
   - Finds ES module imports
   - Reads and inlines imported modules
   - Wraps in IIFE to prevent conflicts
   - Removes import statements

### Troubleshooting Build Issues

- **Service worker errors**: Check that `background.js` has no `import` statements
- **Asset loading errors**: Verify `base: "./"` is set in Vite config
- **Variable conflicts**: Ensure IIFE wrapping is working correctly in the plugin

## Browser Compatibility

- Chrome/Chromium-based browsers
- Firefox (Developer Edition or regular)
- Uses `webextension-polyfill` for cross-browser compatibility

