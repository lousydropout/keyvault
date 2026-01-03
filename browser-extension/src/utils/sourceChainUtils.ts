import { ChainAccountInfo } from "@/utils/discoverAccounts";

/**
 * Source chain info displayed in the UI.
 */
export type SourceChainInfo = {
  chainId: number;
  chainName: string;
  numEntries: number;
};

/**
 * Determines the chain with the most entries to use as the credential source.
 * Pure function for testing.
 *
 * @param accounts - Array of chain account info from discoverAccounts
 * @param enabledChainIds - Array of enabled chain IDs
 * @returns SourceChainInfo for the chain with most entries, or null if none found
 */
export const getSourceChainFromAccounts = (
  accounts: ChainAccountInfo[],
  enabledChainIds: number[]
): SourceChainInfo | null => {
  // Filter to only enabled chains
  const enabledAccounts = accounts.filter((a) =>
    enabledChainIds.includes(a.chainId)
  );

  if (enabledAccounts.length === 0) return null;

  // Find chain with most entries
  const source = enabledAccounts.reduce((max, current) =>
    current.numEntries > max.numEntries ? current : max
  );

  return {
    chainId: source.chainId,
    chainName: source.chainName,
    numEntries: source.numEntries,
  };
};

/**
 * Gets formatted display text for the source chain indicator.
 *
 * @param sourceChain - Source chain info
 * @returns Display text like "Reading from Base", or null if no source
 */
export const getSourceDisplayText = (
  sourceChain: SourceChainInfo | null
): string | null => {
  if (!sourceChain) return null;
  return `Reading from ${sourceChain.chainName}`;
};
