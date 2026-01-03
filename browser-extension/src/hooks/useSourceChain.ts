import { useCallback, useEffect, useMemo, useState } from "react";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useEnabledChains } from "@/hooks/useEnabledChains";
import { PUBKEY, NUM_ENTRIES } from "@/constants/hookVariables";
import { SETUP_ENCRYPTION_KEY } from "@/constants/steps";
import { discoverAccounts } from "@/utils/discoverAccounts";
import { filterChainIdsByDevMode } from "@/utils/enabledChainsUtils";
import {
  SourceChainInfo,
  getSourceChainFromAccounts,
  getSourceDisplayText,
} from "@/utils/sourceChainUtils";
import { Hex } from "viem";

// Re-export for convenience
export type { SourceChainInfo } from "@/utils/sourceChainUtils";
export { getSourceChainFromAccounts } from "@/utils/sourceChainUtils";

// Module-level flags to prevent duplicate discovery calls across remounts
let sourceChainDiscoveryInProgress = false;
let sourceChainDiscoveryKey: string | null = null;

export type UseSourceChainOptions = {
  /** Current app step - discovery is skipped during SETUP_ENCRYPTION_KEY */
  step?: number;
};

/**
 * Hook for managing the source chain (chain with most entries).
 *
 * On login, queries all enabled chains and determines which has the most entries.
 * This chain is used as the source for reading credentials.
 *
 * @param options.step - Current app step. Discovery is skipped during setup
 *   because encryptionKeySetup.tsx already handles discovery for all chains.
 */
export const useSourceChain = (options: UseSourceChainOptions = {}) => {
  const { step } = options;
  const { enabledChainIds, hasLoaded: enabledChainsLoaded } = useEnabledChains();
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");
  const [devMode] = useBrowserStoreLocal<boolean>("devMode", false);
  const [_numEntries, setNumEntries] = useBrowserStoreLocal<number>(
    NUM_ENTRIES,
    -1
  );

  const [sourceChain, setSourceChain] = useState<SourceChainInfo | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and memoize enabledChainIds - excludes localhost when devMode is off
  const stableEnabledChainIds = useMemo(() => {
    const filtered = filterChainIdsByDevMode(enabledChainIds, devMode);
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledChainIds.join(","), devMode]);

  /**
   * Discovers chain statuses and determines source chain.
   */
  const discoverSourceChain = useCallback(async () => {
    if (!pubkey || stableEnabledChainIds.length === 0) {
      setSourceChain(null);
      return;
    }

    setIsDiscovering(true);
    setError(null);

    try {
      const result = await discoverAccounts(pubkey as Hex, stableEnabledChainIds);
      const source = getSourceChainFromAccounts(result.accounts, stableEnabledChainIds);

      if (source) {
        setSourceChain(source);
        setNumEntries(source.numEntries);
      } else {
        setSourceChain(null);
        setError("No chains found with data");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Discovery failed";
      setError(message);
      setSourceChain(null);
    } finally {
      setIsDiscovering(false);
    }
  }, [pubkey, stableEnabledChainIds, setNumEntries]);

  // Auto-discover on mount when dependencies are ready (runs only once per pubkey+chains combo)
  useEffect(() => {
    const discoveryKey = `${pubkey}:${stableEnabledChainIds.join(",")}`;

    // Skip during setup - encryptionKeySetup.tsx handles discovery for all chains
    // This prevents duplicate RPC calls when both components try to discover
    if (step === SETUP_ENCRYPTION_KEY) {
      return;
    }

    // Skip if: not loaded, no pubkey, no chains, already in progress, or already done for this key
    if (
      !enabledChainsLoaded ||
      !pubkey ||
      stableEnabledChainIds.length === 0 ||
      sourceChainDiscoveryInProgress ||
      sourceChainDiscoveryKey === discoveryKey
    ) {
      return;
    }

    sourceChainDiscoveryInProgress = true;
    sourceChainDiscoveryKey = discoveryKey;
    discoverSourceChain().finally(() => {
      sourceChainDiscoveryInProgress = false;
    });
  }, [enabledChainsLoaded, pubkey, stableEnabledChainIds, discoverSourceChain, step]);

  return {
    sourceChain,
    sourceChainId: sourceChain?.chainId ?? null,
    isDiscovering,
    error,
    discoverSourceChain,
    sourceDisplayText: getSourceDisplayText(sourceChain),
  };
};
