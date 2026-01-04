import { getChainConfig } from "@/constants/chains";
import { keyvaultAbi as abi } from "@/keyvault.abi";
import { createPublicClient, getContract, http, PublicClient } from "viem";

export { abi };

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
