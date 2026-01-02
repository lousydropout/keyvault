import { createChainContract } from "@/config";
import { SUPPORTED_CHAIN_IDS, CHAIN_CONFIGS } from "@/constants/chains";
import { logger } from "@/utils/logger";
import { Hex } from "viem";

export type ChainAccountInfo = {
  chainId: number;
  chainName: string;
  numEntries: number;
};

export type ChainStatus = {
  chainId: number;
  chainName: string;
  status: "found" | "not_found" | "error";
  numEntries: number;
  error?: string;
};

export type DiscoveryResult = {
  accounts: ChainAccountInfo[];
  allChains: ChainStatus[];
  errors: { chainId: number; chainName: string; error: string }[];
};

/**
 * Discovers user accounts across ALL supported chains.
 *
 * Queries numEntries on each chain in parallel and returns chains where
 * the user has at least one entry (numEntries > 0).
 *
 * Individual chain failures are captured in the errors array but don't
 * block discovery on other chains.
 *
 * @param pubkey - The user's public key (wallet address)
 * @param chainIds - Optional list of chain IDs to check (defaults to all supported chains)
 * @returns DiscoveryResult with accounts found and any errors encountered
 */
export const discoverAccounts = async (
  pubkey: Hex,
  chainIds: number[] = SUPPORTED_CHAIN_IDS
): Promise<DiscoveryResult> => {
  const results = await Promise.allSettled(
    chainIds.map(async (chainId) => {
      const contract = createChainContract(chainId);
      const result = await contract.read.numEntries([pubkey]);
      const numEntries = Number.parseInt(result?.toString() || "0");
      return {
        chainId,
        chainName: CHAIN_CONFIGS[chainId]?.name || `Chain ${chainId}`,
        numEntries,
      };
    })
  );

  const accounts: ChainAccountInfo[] = [];
  const allChains: ChainStatus[] = [];
  const errors: DiscoveryResult["errors"] = [];

  results.forEach((result, index) => {
    const chainId = chainIds[index];
    const chainName = CHAIN_CONFIGS[chainId]?.name || `Chain ${chainId}`;

    if (result.status === "fulfilled") {
      const numEntries = result.value.numEntries;
      if (numEntries > 0) {
        accounts.push(result.value);
        allChains.push({ chainId, chainName, status: "found", numEntries });
      } else {
        allChains.push({ chainId, chainName, status: "not_found", numEntries: 0 });
      }
    } else {
      const errorMessage =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      logger.warn(`Failed to query chain ${chainName}:`, errorMessage);
      errors.push({ chainId, chainName, error: errorMessage });
      allChains.push({ chainId, chainName, status: "error", numEntries: 0, error: errorMessage });
    }
  });

  return { accounts, allChains, errors };
};

/**
 * Convenience function to check if user has an account on any chain.
 */
export const hasAccountOnAnyChain = async (pubkey: Hex): Promise<boolean> => {
  const { accounts } = await discoverAccounts(pubkey);
  return accounts.length > 0;
};

/**
 * Get the single chain where user has an account, or null if none/multiple.
 * Useful for auto-selecting chain when there's only one option.
 */
export const getSingleAccountChain = async (
  pubkey: Hex
): Promise<ChainAccountInfo | null> => {
  const { accounts } = await discoverAccounts(pubkey);
  return accounts.length === 1 ? accounts[0] : null;
};
