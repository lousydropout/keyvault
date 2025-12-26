import { base, astar, hardhat } from "viem/chains";
import { Chain, Hex } from "viem";
import { localKeyvaultAddress } from "@/utils/localKeyvaultAddress";

export type ChainConfig = {
  chain: Chain;
  address: Hex;
  apiUrl: string;
  dappUrl: string;
  name: string;
};

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [astar.id]: {
    chain: astar,
    address: "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B" as Hex,
    apiUrl: "https://evm.astar.network",
    dappUrl: "https://dapp.blockchainkeyvault.com",
    name: "Astar",
  },
  [base.id]: {
    chain: base,
    address: "0x_YOUR_BASE_ADDRESS_HERE" as Hex, // Replace after deployment
    apiUrl: "https://mainnet.base.org",
    dappUrl: "https://dapp.blockchainkeyvault.com",
    name: "Base",
  },
  [hardhat.id]: {
    chain: hardhat,
    address: localKeyvaultAddress,
    apiUrl: "http://localhost:8545",
    dappUrl: "http://localhost:5173",
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
