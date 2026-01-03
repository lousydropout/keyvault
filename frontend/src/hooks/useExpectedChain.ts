import { useMemo, useSyncExternalStore } from "react";
import { CHAIN_CONFIGS, isValidChainId, DEFAULT_CHAIN_ID } from "@/chainConfig";

export type ExpectedChainInfo = {
  chainId: number;
  chainName: string;
  isFromUrl: boolean;
};

/**
 * Parse chain query param in format: name_id (e.g., "base_8453")
 * Returns the chain ID if valid, null otherwise.
 */
const parseChainParam = (param: string | null): number | null => {
  if (!param) return null;

  // Format: name_id (e.g., "base_8453", "localhost_31337")
  const parts = param.split("_");
  if (parts.length < 2) return null;

  // The ID is the last part (in case name has underscores)
  const idStr = parts[parts.length - 1];
  const chainId = parseInt(idStr, 10);

  if (isNaN(chainId) || !isValidChainId(chainId)) return null;

  return chainId;
};

/**
 * Get the current URL search string.
 * Uses useSyncExternalStore to properly subscribe to URL changes.
 */
const getSearchString = () => window.location.search;
const subscribeToUrl = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};

/**
 * Hook to get the expected chain from URL query param.
 *
 * Parses ?chain=<name>_<id> from the URL.
 * Falls back to DEFAULT_CHAIN_ID if not specified or invalid.
 *
 * Note: Uses native URL API instead of react-router's useSearchParams
 * so it can be used outside of Router context.
 */
export const useExpectedChain = (): ExpectedChainInfo => {
  const search = useSyncExternalStore(subscribeToUrl, getSearchString);

  return useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const chainParam = searchParams.get("chain");
    const parsedChainId = parseChainParam(chainParam);

    if (parsedChainId !== null) {
      const config = CHAIN_CONFIGS[parsedChainId];
      return {
        chainId: parsedChainId,
        chainName: config.name,
        isFromUrl: true,
      };
    }

    // Fallback to default chain
    const defaultConfig = CHAIN_CONFIGS[DEFAULT_CHAIN_ID];
    return {
      chainId: DEFAULT_CHAIN_ID,
      chainName: defaultConfig.name,
      isFromUrl: false,
    };
  }, [search]);
};
