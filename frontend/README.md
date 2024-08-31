# Keyvault Frontend

## Switching network

Currently, only localhost is likely usable.
However, to change network, update the `NETWORK` constant in `browser-extension/src/utils/contract.ts` line 7.

## Localhost

To get started with development or testing on localhost,

1. [Start a local instance of the hardnet test network] Open a new terminal in the `contract/` and run `pnpm local:node`.
2. [Deploy `keyvault` to the local testnet] Open a new terminal in the `contract/` and run `pnpm local:deploy`. This should look something like the following

   ```output
   $ pnpm local:deploy
   Hardhat Ignition 🚀

   Deploying [ KeyvaultModule ]

   Batch #1
     Executed KeyvaultModule#Keyvault

   [ KeyvaultModule ] successfully deployed 🚀

   Deployed Addresses

   KeyvaultModule#Keyvault - 0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

   Take note of the deployed address. If you accidentally closed the terminal before noting the deployed address, simply run

   ```bash
   $ pnpm hardhat ignition status localhost-london
   ```

3. If the deployed address is not `0x5FbDB2315678afecb367f032d93F642f64180aa3`, then you may need to restart the `frontend` and reload the `browser extension`. The above command, `pnpm local:deploy` generates and copys the deployed address to the frontend and browser extension, but the compiled/bundled versions may outdated or require reloading.
