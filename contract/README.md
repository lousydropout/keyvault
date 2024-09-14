# Keyvault Smart Contract

Note: All commands below are meant to be run inside this directory. If, we consider the root directory to be `keyvault/`, then this directory is `keyvault/contract/`.

## Installation

For whatever reason, `Viem` did not work well with the `Hardhat` localnet (at least for `keyvault`). However, `Viem` seems to have no issues with `Foundry`'s `Anvil`.

So, `Foundry` is currently a prerequisite for local testing. To install `Foundry`, please follow the instructions located at [https://book.getfoundry.sh/getting-started/installation](https://book.getfoundry.sh/getting-started/installation).

Beyond which, please run

```bash
pnpm install
```

## Running locally

The commands have already been added to `package.json` as scripts for dev convenience.

1. Run local hardhat network ("localhost")

   ```bash
   pnpm local:node
   ```

2. Deploy to localhost in a new terminal

   ```bash
   pnpm local:deploy
   ```

## Debugging locally

Sometimes, it can be nice to interact directly with the smart contract instead of via the frontend. This is especially so when debugging smart contract interactions on the frontend.

In those cases, I've found two helpful options:

1. `remix` and
2. `hardhat console`.

### using Remix

To use [Remix](https://remix.ethereum.org), please check out `Remix`'s guide to interacting with `Foundry`: [https://github.com/ethereum/remix-ide/blob/master/docs/foundry.md](https://github.com/ethereum/remix-ide/blob/master/docs/foundry.md).

After running the anvil localnet and deploying the smart contract there, the remaining steps are roughly

1. go to [Remix](https://remix.ethereum.org),
2. switch the environment to use `Foundry Provider`,
3. copy the `Keyvault.sol` smart contract to `remix` and compile (usually just hitting `ctrl-S` will do the trick),
4. go to the `deploy` tab on the left, and
5. provide the `At Address` input with the address of the smart contract on the anvil localnet (it is likely `0x5FbDB2315678afecb367f032d93F642f64180aa3`).

This should provide you with a nice, simple interface for interacting `Keyvault` with.

### using Hardhat console

After deploying `keyvault` to the anvil localnet, you can also interact with the smart contract via `hardhat console`.

To do so, simply run

```bash
pnpm hardhat console
```

To then grab and interact with the deployed `Keyvault` smart contract, run

```typescript
> Keyvault = await ethers.getContractFactory("Keyvault")
> keyvault = Keyvault.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3")  # grabs the specific `Keyvault` contract at provided address
```

You can then interact with the smart contract as you wish.

For example, to check the number of entries associated with a given pubkey,

```typescript
> numEntries = await keyvault.numEntries("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")  # replace with the pubkey you're using
```
