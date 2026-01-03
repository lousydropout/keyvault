import { useEnabledChains } from "@/hooks/useEnabledChains";
import { ChainStatus } from "@/utils/discoverAccounts";
import {
  filterChainIdsByDevMode,
  filterChainStatusesByDevMode,
} from "@/utils/enabledChainsUtils";
import {
  EnabledChainsSectionView,
  type EnabledChainsSectionViewProps,
} from "./EnabledChainsSectionView";

// Re-export types for convenience
export type { EnabledChainsSectionViewProps };

export type EnabledChainsSectionProps = {
  chainStatuses: ChainStatus[];
  isLoading?: boolean;
  devMode?: boolean;
};

/**
 * Enabled chains section for the Settings page.
 *
 * Displays a list of supported chains with toggles to enable/disable them.
 * All chains can be enabled, allowing users to sync to chains without existing data.
 * Localhost is only shown when devMode is enabled.
 */
export const EnabledChainsSection = ({
  chainStatuses,
  isLoading = false,
  devMode = false,
}: EnabledChainsSectionProps) => {
  const { enabledChainIds, addChain, removeChain } = useEnabledChains();

  const handleToggleChain = (chainId: number, enabled: boolean) => {
    if (enabled) {
      addChain(chainId);
    } else {
      removeChain(chainId);
    }
  };

  const filteredStatuses = filterChainStatusesByDevMode(chainStatuses, devMode);
  const filteredChainIds = filterChainIdsByDevMode(enabledChainIds, devMode);

  const viewChainStatuses = filteredStatuses.map((status) => ({
    chainId: status.chainId,
    chainName: status.chainName,
    numEntries: status.numEntries,
  }));

  return (
    <EnabledChainsSectionView
      chainStatuses={viewChainStatuses}
      enabledChainIds={filteredChainIds}
      onToggleChain={handleToggleChain}
      isLoading={isLoading}
    />
  );
};
