import { keyvaultAbi as abi } from "@/keyvault.abi";
import { localKeyvaultAddress } from "@/localKeyvaultAddress.ts";
import { CHAIN_CONFIGS } from "@/chainConfig";
import { createPublicClient, Hex } from "viem";
import { createConfig, http } from "wagmi";
import { astar, base, hardhat } from "wagmi/chains";

// Build-time network selection
export const NETWORK: "localhost" | "astar" | "base" =
  import.meta.env.VITE_NETWORK === "astar" ? "astar" :
  import.meta.env.VITE_NETWORK === "base" ? "base" : "localhost";

/**
 * Sets the chain configuration based on the provided network.
 *
 * @param network - The network to set the chain configuration for.
 * @returns An object containing the chain and address.
 * @throws {Error} If the provided network is invalid.
 */
const setChainConfig = (network: string) => {
  const allowedNetworks = new Set(["localhost", "astar", "base"]);

  if (!allowedNetworks.has(network)) throw new Error("Invalid chain");

  let chain, address, apiUrl;
  switch (network) {
    case "astar":
      chain = astar;
      address = CHAIN_CONFIGS[astar.id].address;
      apiUrl = CHAIN_CONFIGS[astar.id].apiUrl;
      break;
    case "base":
      chain = base;
      address = CHAIN_CONFIGS[base.id].address;
      apiUrl = CHAIN_CONFIGS[base.id].apiUrl;
      break;
    case "localhost":
      chain = hardhat;
      address = localKeyvaultAddress;
      apiUrl = CHAIN_CONFIGS[hardhat.id].apiUrl;
      break;
    default:
      throw new Error("Invalid chain");
  }
  return { chain, address, apiUrl };
};

export { abi };
export const { chain, address, apiUrl } = setChainConfig(NETWORK);

// Wagmi config with all supported chains
export const config = createConfig({
  chains: [hardhat, astar, base],
  transports: {
    [hardhat.id]: http(),
    [astar.id]: http(),
    [base.id]: http(),
  },
});

export const client = createPublicClient({ chain, transport: http() });
