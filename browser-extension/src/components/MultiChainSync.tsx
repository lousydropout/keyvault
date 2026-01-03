import { useMachine } from "@xstate/react";
import { useEffect } from "react";
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
import { MultiChainSyncView } from "@/components/MultiChainSyncView";

/**
 * Props for the container component.
 */
type MultiChainSyncProps = {
  sourceEncrypteds?: Encrypted[];
};

/**
 * Container component for multi-chain sync functionality.
 * Uses XState machine for state management.
 */
export const MultiChainSync = ({ sourceEncrypteds = [] }: MultiChainSyncProps) => {
  const { enabledChainIds, hasLoaded } = useEnabledChains();
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");

  const [state, send] = useMachine(multiChainSyncMachine, {
    input: { enabledChainIds },
  });

  // Trigger discovery when loaded and pubkey available
  useEffect(() => {
    if (hasLoaded && pubkey && enabledChainIds.length > 0) {
      send({ type: "DISCOVER", pubkey: pubkey as Hex, enabledChainIds });
    }
  }, [hasLoaded, pubkey, enabledChainIds, send]);

  // Opens the frontend for a specific chain (user should connect wallet there)
  const handleOpenFrontend = async (targetChainId: number) => {
    const url = getDappUrlWithChain(targetChainId);
    await chrome.tabs.create({ url });
  };

  // Pushes delta entries to the frontend via Chrome messaging
  const handlePush = (targetChainId: number) => {
    const targetStatus = state.context.chainStatuses.get(targetChainId);
    if (!targetStatus || !pubkey) return;

    const deltaEntries = calculateDeltaEntries(
      sourceEncrypteds,
      targetStatus.numEntries
    );

    send({ type: "SYNC", targetChainId, deltaEntries, address: pubkey as Hex });
  };

  const handleRetry = () => {
    send({ type: "DISCOVER", pubkey: pubkey as Hex, enabledChainIds });
  };

  const handleDiscover = () => {
    send({ type: "DISCOVER", pubkey: pubkey as Hex, enabledChainIds });
  };

  const isDiscovering = state.matches("discovering");
  const isSyncing = state.matches("syncing");

  return (
    <MultiChainSyncView
      enabledChainIds={enabledChainIds}
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
