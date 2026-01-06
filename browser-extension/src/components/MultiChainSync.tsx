import { useMachine } from "@xstate/react";
import { useEffect, useMemo } from "react";
import { useEnabledChains } from "@/hooks/useEnabledChains";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { PUBKEY } from "@/constants/hookVariables";
import { getDappUrlWithChain } from "@/constants/chains";
import {
  multiChainSyncMachine,
  calculateDeltaEntries,
} from "@/machines/multiChainSync.machine";
import { Hex } from "viem";
import { Encrypted } from "@/utils/encryption";
import { filterChainIdsByDevMode } from "@/utils/enabledChainsUtils";
import { MultiChainSyncView } from "@/components/MultiChainSyncView";
import { Cred, encryptEntries } from "@/utils/credentials";

/**
 * Props for the container component.
 */
type MultiChainSyncProps = {
  sourceEncrypteds?: Encrypted[];
  devMode?: boolean;
  pendingCreds?: Cred[];
  cryptoKey?: CryptoKey | null;
};

/**
 * Container component for multi-chain sync functionality.
 * Uses XState machine for state management.
 * Localhost is hidden when devMode is off.
 */
export const MultiChainSync = ({
  sourceEncrypteds = [],
  devMode = false,
  pendingCreds = [],
  cryptoKey = null,
}: MultiChainSyncProps) => {
  // Total local entries = synced entries + 1 if there are pending creds to encrypt
  // Each push of pendingCreds becomes one new encrypted entry
  const pendingEntryCount = pendingCreds.length > 0 ? 1 : 0;
  const totalLocalCredentialCount = sourceEncrypteds.length + pendingEntryCount;
  const { enabledChainIds, hasLoaded } = useEnabledChains();
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");

  const filteredChainIds = useMemo(
    () => filterChainIdsByDevMode(enabledChainIds, devMode),
    [enabledChainIds, devMode]
  );

  const [state, send] = useMachine(multiChainSyncMachine, {
    input: { enabledChainIds: filteredChainIds },
  });

  // Trigger discovery when loaded and pubkey available
  useEffect(() => {
    if (hasLoaded && pubkey && filteredChainIds.length > 0) {
      send({
        type: "DISCOVER",
        pubkey: pubkey as Hex,
        enabledChainIds: filteredChainIds,
        localCredentialCount: totalLocalCredentialCount,
      });
    }
  }, [hasLoaded, pubkey, filteredChainIds, totalLocalCredentialCount, send]);

  // Opens the frontend for a specific chain (user should connect wallet there)
  const handleOpenFrontend = async (targetChainId: number) => {
    const url = getDappUrlWithChain(targetChainId);
    await chrome.tabs.create({ url });
  };

  // Pushes delta entries to the frontend via Chrome messaging
  const handlePush = async (targetChainId: number) => {
    const targetStatus = state.context.chainStatuses.get(targetChainId);
    if (!targetStatus || !pubkey) return;

    // Get entries from sourceEncrypteds that target chain is missing
    const deltaFromEncrypteds = calculateDeltaEntries(
      sourceEncrypteds,
      targetStatus.numEntries
    );

    // Encrypt pending credentials if any exist and we have a crypto key
    let deltaEntries = [...deltaFromEncrypteds];
    if (pendingCreds.length > 0 && cryptoKey) {
      const encryptedPending = await encryptEntries(cryptoKey, pendingCreds);
      deltaEntries.push(encryptedPending);
    }

    send({ type: "SYNC", targetChainId, deltaEntries, address: pubkey as Hex });
  };

  const handleRetry = () => {
    send({
      type: "DISCOVER",
      pubkey: pubkey as Hex,
      enabledChainIds: filteredChainIds,
      localCredentialCount: totalLocalCredentialCount,
    });
  };

  const handleDiscover = () => {
    send({
      type: "DISCOVER",
      pubkey: pubkey as Hex,
      enabledChainIds: filteredChainIds,
      localCredentialCount: totalLocalCredentialCount,
    });
  };

  const isDiscovering = state.matches("discovering");
  const isSyncing = state.matches("syncing");

  return (
    <MultiChainSyncView
      enabledChainIds={filteredChainIds}
      chainStatuses={state.context.chainStatuses}
      isDiscovering={isDiscovering}
      isSyncing={isSyncing}
      syncTargetChainId={state.context.syncTargetChainId}
      error={state.context.error}
      onOpenFrontend={handleOpenFrontend}
      onPush={handlePush}
      onRetry={handleRetry}
      onDiscover={handleDiscover}
    />
  );
};
