# KeyVault

A decentralized password/credential vault with blockchain-based encrypted storage.

## Project Structure

```
keyvault/
├── browser-extension/   # Chrome/Firefox extension (React + Vite)
├── frontend/            # Web frontend (React + Vite + Wagmi)
├── contract/            # Solidity smart contracts (Hardhat)
└── agent-os/            # Agent OS standards and specs
```

## Quick Start

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Development
cd browser-extension && bun run dev        # Extension dev build
cd frontend && bun run dev                 # Web frontend dev server
cd contract && bun run local:node          # Local Anvil node
```

## Tech Stack

- **Runtime**: Bun + TypeScript
- **Frontend**: React 18, TanStack Query, Tailwind CSS, Radix UI
- **Blockchain**: Solidity, Hardhat, Viem, Wagmi
- **Crypto**: OpenPGP, TweetNaCl, Scrypt, Shamir's Secret Sharing
- **Testing**: Vitest (frontend), Bun test (extension), Hardhat/Chai (contracts)

## Key Directories

- `browser-extension/src/components/` - UI components
- `browser-extension/src/utils/` - Crypto and utility functions
- `browser-extension/src/hooks/` - React hooks
- `browser-extension/src/constants/` - Chain configs and constants
- `frontend/src/` - Web app source
- `contract/contracts/` - Solidity contracts

## Networks

- **Production**: Astar, Base
- **Development**: localhost (Anvil)

### Contract Addresses

| Network | Address |
|---------|---------|
| Astar | `0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B` |
| Base | `0x4DecB055bC80Ad00098A2CDda4E2c76b546E9403` |
| Localhost | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |

## Standards

Project standards are in `agent-os/standards/`. Key standards:
- `global/tech-stack.md` - Full tech stack reference
- `global/coding-style.md` - TypeScript/React conventions
- `testing/test-writing.md` - Test patterns and commands
