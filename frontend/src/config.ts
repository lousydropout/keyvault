import { keyvaultAbi as abi } from "@/keyvault.abi";
import { localKeyvaultAddress } from "@/localKeyvaultAddress.ts";
import { createPublicClient, getContract, Hex } from "viem";
import { createConfig, http } from "wagmi";
import { astar, hardhat } from "wagmi/chains";

// Modify the NETWORK constant to the desired chain here
export const NETWORK: "localhost" | "astar" = "localhost";

/**
 * Sets the chain configuration based on the provided network.
 *
 * @param network - The network to set the chain configuration for.
 * @returns An object containing the chain and address.
 * @throws {Error} If the provided network is invalid.
 */
const setChainConfig = (network: string) => {
  const allowedNetworks = new Set(["localhost", "astar"]);

  if (!allowedNetworks.has(network)) throw new Error("Invalid chain");

  let chain, address, apiUrl;
  switch (network) {
    case "astar":
      chain = astar;
      address = "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B" as Hex;
      apiUrl = "https://evm.astar.network"; // TODO: Get non-public RPC Node
      break;
    case "localhost":
      chain = hardhat;
      address = localKeyvaultAddress;
      apiUrl = "http://localhost:8545";
      break;
    default:
      throw new Error("Invalid chain");
  }
  return { chain, address, apiUrl };
};

export { abi };
export const { chain, address, apiUrl } = setChainConfig(NETWORK);

export const config = createConfig({
  chains: [hardhat, astar],
  transports: {
    [hardhat.id]: http(),
    [astar.id]: http(),
  },
});

export const client = createPublicClient({ chain, transport: http() });
export const contract = getContract({
  abi,
  address: localKeyvaultAddress,
  client,
});
