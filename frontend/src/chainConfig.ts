import { base, astar, hardhat, Chain } from "wagmi/chains";
import { Hex } from "viem";
import { localKeyvaultAddress } from "@/localKeyvaultAddress.ts";

export type ChainConfig = {
  chain: Chain;
  address: Hex;
  apiUrl: string;
  name: string;
};

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [astar.id]: {
    chain: astar,
    address: "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B" as Hex,
    apiUrl: "https://evm.astar.network",
    name: "Astar",
  },
  [base.id]: {
    chain: base,
    address: "0xfF8810ab83DD4404E71a917c4925e8f686Ab75F5" as Hex,
    apiUrl: "https://mainnet.base.org",
    name: "Base",
  },
  [hardhat.id]: {
    chain: hardhat,
    address: localKeyvaultAddress,
    apiUrl: "http://localhost:8545",
    name: "Localhost",
  },
};

export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_CONFIGS).map(Number);
export const DEFAULT_CHAIN_ID = astar.id;

export const getChainConfig = (chainId: number): ChainConfig => {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) throw new Error(`Unsupported chain: ${chainId}`);
  return config;
};

export const isValidChainId = (chainId: number): boolean => {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
};
