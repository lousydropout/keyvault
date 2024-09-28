import { ASTAR, LOCALHOST } from "@/constants/networks";
import { keyvaultAbi as abi } from "@/keyvault.abi";
import { localKeyvaultAddress } from "@/utils/localKeyvaultAddress.ts";
import { createPublicClient, getContract, Hex, http } from "viem";
import { astar, hardhat } from "viem/chains";

// Modify the NETWORK constant to the desired chain here

export const NETWORK: typeof LOCALHOST | typeof ASTAR =
  import.meta.env.VITE_NETWORK === ASTAR ? ASTAR : LOCALHOST;

/**
 * Sets the chain configuration based on the provided network.
 *
 * @param network - The network to set the chain configuration for.
 * @returns An object containing the chain and address.
 * @throws {Error} If the provided network is invalid.
 */
const setChainConfig = (network: string) => {
  const allowedNetworks = new Set([LOCALHOST, ASTAR]);

  if (!allowedNetworks.has(network)) throw new Error("Invalid chain");

  let chain, address, apiUrl, dappUrl;
  switch (network) {
    case ASTAR:
      chain = astar;
      address = "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B" as Hex;
      apiUrl = "https://evm.astar.network"; // TODO: Get non-public RPC Node
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

export const { chain, address, apiUrl, dappUrl } = setChainConfig(NETWORK);
export const client = createPublicClient({ chain, transport: http() });
export const contract = getContract({ abi, address, client });
