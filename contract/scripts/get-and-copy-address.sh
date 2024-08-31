#/bin/bash

# Get the address of the locally deployed keyvault contract and save it to a file
address=$(pnpm hardhat ignition status localhost-london | grep -oP '0x[a-fA-F0-9]{40}')
echo "import { Hex } from \"viem\";" > localKeyvaultAddress.ts
echo "" >> localKeyvaultAddress.ts
echo "export const localKeyvaultAddress =" >> localKeyvaultAddress.ts
echo "  \"$address\" as Hex;" >> localKeyvaultAddress.ts

# Copy the address to the frontend

cp localKeyvaultAddress.ts ../frontend/src/localKeyvaultAddress.ts

# Copy the address to the browser-extension
cp localKeyvaultAddress.ts ../browser-extension/src/utils/localKeyvaultAddress.ts
