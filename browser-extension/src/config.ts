import { ASTAR, BASE, LOCALHOST } from "@/constants/networks";
import { CHAIN_CONFIGS, ChainConfig, getChainConfig } from "@/constants/chains";
import { keyvaultAbi as abi } from "@/keyvault.abi";
import { localKeyvaultAddress } from "@/utils/localKeyvaultAddress.ts";
import { createPublicClient, getContract, Hex, http, PublicClient } from "viem";
import { astar, base, hardhat } from "viem/chains";

export { abi };

// Build-time default (used for initial load before storage is read)
export const NETWORK: typeof LOCALHOST | typeof ASTAR | typeof BASE =
  import.meta.env.VITE_NETWORK === ASTAR ? ASTAR :
  import.meta.env.VITE_NETWORK === BASE ? BASE : LOCALHOST;

// Create client for a specific chain
export const createChainClient = (chainId: number): PublicClient => {
  const config = getChainConfig(chainId);
  return createPublicClient({
    chain: config.chain,
    transport: http(config.apiUrl),
  });
};

// Create contract instance for a specific chain
export const createChainContract = (chainId: number) => {
  const config = getChainConfig(chainId);
  const client = createChainClient(chainId);
  return getContract({
    abi,
    address: config.address,
    client,
  });
};

/**
 * Legacy: Sets the chain configuration based on the provided network.
 * Kept for backward compatibility during migration.
 */
const setChainConfig = (network: string) => {
  const allowedNetworks = new Set([LOCALHOST, ASTAR, BASE]);

  if (!allowedNetworks.has(network)) throw new Error("Invalid chain");

  let chain, address, apiUrl, dappUrl;
  switch (network) {
    case ASTAR:
      chain = astar;
      address = "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B" as Hex;
      apiUrl = "https://evm.astar.network";
      dappUrl = "https://dapp.blockchainkeyvault.com";
      break;
    case BASE:
      chain = base;
      address = CHAIN_CONFIGS[base.id].address;
      apiUrl = "https://mainnet.base.org";
      dappUrl = "https://dapp.blockchainkeyvault.com";
      break;
    case LOCALHOST:
      chain = hardhat;
      address = localKeyvaultAddress;
      apiUrl = "http://localhost:8545";
      dappUrl = "http://localhost:5173";
      break;
    default:
      throw new Error("Invalid chain");
  }
  return { chain, address, apiUrl, dappUrl };
};

// Legacy exports for backward compatibility during migration
export const { chain, address, apiUrl, dappUrl } = setChainConfig(NETWORK);
export const client = createPublicClient({ chain, transport: http() });
export const contract = getContract({ abi, address, client });
