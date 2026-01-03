import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChainAccountInfo } from "@/utils/discoverAccounts";

type ChainSelectionScreenProps = {
  discoveredChains: ChainAccountInfo[];
  onContinue: (selectedChainIds: number[]) => void;
};

/**
 * Pure helper functions for chain selection logic.
 * These can be tested independently of React.
 */
export const chainSelectionHelpers = {
  /**
   * Toggles a chain ID in the selection set.
   */
  toggleChainInSet: (current: Set<number>, chainId: number): Set<number> => {
    const updated = new Set(current);
    if (updated.has(chainId)) {
      updated.delete(chainId);
    } else {
      updated.add(chainId);
    }
    return updated;
  },

  /**
   * Checks if continue button should be enabled.
   */
  canContinue: (selectedCount: number): boolean => {
    return selectedCount > 0;
  },

  /**
   * Gets initial selection (all chains selected by default).
   */
  getInitialSelection: (chains: ChainAccountInfo[]): Set<number> => {
    return new Set(chains.map((chain) => chain.chainId));
  },

  /**
   * Gets selection summary text.
   */
  getSelectionSummary: (selectedCount: number, totalCount: number): string => {
    const chainWord = totalCount !== 1 ? "chains" : "chain";
    return `${selectedCount} of ${totalCount} ${chainWord} selected`;
  },
};

/**
 * Presentational component for a single chain item.
 * This is a pure function that can be tested directly.
 */
export const ChainSelectionItem = ({
  chain,
  isSelected,
  onToggle,
}: {
  chain: ChainAccountInfo;
  isSelected: boolean;
  onToggle: () => void;
}) => {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
        isSelected
          ? "bg-slate-700 border-2 border-green-500"
          : "bg-slate-800 border border-slate-600 hover:border-slate-500"
      }`}
      onClick={onToggle}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          id={`chain-${chain.chainId}`}
          checked={isSelected}
          onCheckedChange={onToggle}
          className="border-slate-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
        />
        <Label
          htmlFor={`chain-${chain.chainId}`}
          className="text-lg text-white cursor-pointer"
        >
          {chain.chainName}
        </Label>
      </div>

      <span className="text-sm text-green-400">
        {chain.numEntries} credential{chain.numEntries !== 1 ? "s" : ""}
      </span>
    </div>
  );
};

/**
 * Chain selection screen for onboarding flow.
 *
 * Displays chains where user has existing data and allows selecting
 * which chains to enable for multi-chain sync. User must select at
 * least one chain to proceed.
 */
export const ChainSelectionScreen = ({
  discoveredChains,
  onContinue,
}: ChainSelectionScreenProps) => {
  // Initialize with all chains selected by default
  const [selectedChainIds, setSelectedChainIds] = useState<Set<number>>(() =>
    chainSelectionHelpers.getInitialSelection(discoveredChains)
  );

  const toggleChain = useCallback((chainId: number) => {
    setSelectedChainIds((current) =>
      chainSelectionHelpers.toggleChainInSet(current, chainId)
    );
  }, []);

  const handleContinue = useCallback(() => {
    const chainIds = Array.from(selectedChainIds);
    onContinue(chainIds);
  }, [selectedChainIds, onContinue]);

  const hasSelections = chainSelectionHelpers.canContinue(selectedChainIds.size);
  const hasMultipleChains = discoveredChains.length > 1;

  // Handle edge case of no chains
  if (discoveredChains.length === 0) {
    return (
      <div className="flex flex-col gap-4 px-2 py-4">
        <h1 className="text-4xl text-center mt-4">No Chains Found</h1>
        <p className="text-lg text-center text-slate-300">
          No chains with existing data were discovered.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-2 py-4">
      <h1 className="text-4xl text-center mt-4">Enable Chains</h1>

      <p className="text-lg text-center text-slate-300 mt-2">
        {hasMultipleChains
          ? "Select the chains you want to enable for multi-chain sync."
          : "Your account was found on the following chain."}
      </p>

      {/* Chain selection list */}
      <div className="flex flex-col gap-3 mt-4">
        {discoveredChains.map((chain) => (
          <ChainSelectionItem
            key={chain.chainId}
            chain={chain}
            isSelected={selectedChainIds.has(chain.chainId)}
            onToggle={() => toggleChain(chain.chainId)}
          />
        ))}
      </div>

      {/* Selection summary */}
      <p className="text-sm text-slate-400 text-center mt-2">
        {chainSelectionHelpers.getSelectionSummary(
          selectedChainIds.size,
          discoveredChains.length
        )}
      </p>

      {/* Continue button */}
      <Button
        className="border rounded-xl mt-4"
        onClick={handleContinue}
        disabled={!hasSelections}
        aria-disabled={!hasSelections}
      >
        Continue
      </Button>

      {!hasSelections && (
        <p className="text-sm text-yellow-400 text-center">
          Please select at least one chain to continue.
        </p>
      )}
    </div>
  );
};
