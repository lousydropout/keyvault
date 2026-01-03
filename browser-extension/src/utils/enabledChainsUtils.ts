import { ChainAccountInfo, ChainStatus } from "@/utils/discoverAccounts";
import { hardhat } from "viem/chains";

/**
 * Returns the chain ID with the most entries from a list of chain account info.
 *
 * @param accounts - Array of ChainAccountInfo from discoverAccounts
 * @returns Chain ID with highest numEntries, or null if array is empty
 */
export const getChainWithMostEntries = (
  accounts: ChainAccountInfo[]
): number | null => {
  if (accounts.length === 0) return null;

  let maxChainId = accounts[0].chainId;
  let maxEntries = accounts[0].numEntries;

  for (const account of accounts) {
    if (account.numEntries > maxEntries) {
      maxEntries = account.numEntries;
      maxChainId = account.chainId;
    }
  }

  return maxChainId;
};

/**
 * Pure helper functions for enabled chains array manipulation.
 * These are pure functions that can be tested independently of React/browser storage.
 */
export const enabledChainsHelpers = {
  /**
   * Adds a chain ID to the array if not already present.
   */
  addChainToArray: (current: number[], chainId: number): number[] => {
    if (current.includes(chainId)) return current;
    return [...current, chainId];
  },

  /**
   * Removes a chain ID from the array.
   */
  removeChainFromArray: (current: number[], chainId: number): number[] => {
    return current.filter((id) => id !== chainId);
  },

  /**
   * Checks if a chain ID is in the array.
   */
  isChainInArray: (chainIds: number[], chainId: number): boolean => {
    return chainIds.includes(chainId);
  },
};

/**
 * Filters chain IDs based on dev mode setting.
 * When dev mode is off, localhost (hardhat) is excluded.
 *
 * @param chainIds - Array of chain IDs to filter
 * @param devMode - Whether dev mode is enabled
 * @returns Filtered array of chain IDs
 */
export const filterChainIdsByDevMode = (
  chainIds: number[],
  devMode: boolean
): number[] => {
  if (devMode) return chainIds;
  return chainIds.filter((id) => id !== hardhat.id);
};

/**
 * Filters chain statuses based on dev mode setting.
 * When dev mode is off, localhost (hardhat) is excluded.
 *
 * @param statuses - Array of chain statuses to filter
 * @param devMode - Whether dev mode is enabled
 * @returns Filtered array of chain statuses
 */
export const filterChainStatusesByDevMode = (
  statuses: ChainStatus[],
  devMode: boolean
): ChainStatus[] => {
  if (devMode) return statuses;
  return statuses.filter((s) => s.chainId !== hardhat.id);
};
