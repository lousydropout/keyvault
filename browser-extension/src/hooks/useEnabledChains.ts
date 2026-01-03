import { useCallback } from "react";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import {
  enabledChainsHelpers,
  getChainWithMostEntries,
} from "@/utils/enabledChainsUtils";

const STORAGE_KEY = "enabledChainIds";

/**
 * Hook for managing enabled chain IDs in browser local storage.
 *
 * Provides methods to add, remove, and check chain enablement status.
 * Chain IDs are stored as an array of numbers.
 */
export const useEnabledChains = () => {
  const [enabledChainIds, setEnabledChainIds, hasLoaded] = useBrowserStoreLocal<
    number[]
  >(STORAGE_KEY, []);

  const addChain = useCallback(
    (chainId: number) => {
      setEnabledChainIds((current) =>
        enabledChainsHelpers.addChainToArray(current, chainId)
      );
    },
    [setEnabledChainIds]
  );

  const removeChain = useCallback(
    (chainId: number) => {
      setEnabledChainIds((current) =>
        enabledChainsHelpers.removeChainFromArray(current, chainId)
      );
    },
    [setEnabledChainIds]
  );

  const isChainEnabled = useCallback(
    (chainId: number): boolean => {
      return enabledChainsHelpers.isChainInArray(enabledChainIds, chainId);
    },
    [enabledChainIds]
  );

  return {
    enabledChainIds,
    setEnabledChainIds,
    addChain,
    removeChain,
    isChainEnabled,
    hasLoaded,
  };
};

// Re-export utility for convenience
export { getChainWithMostEntries } from "@/utils/enabledChainsUtils";
