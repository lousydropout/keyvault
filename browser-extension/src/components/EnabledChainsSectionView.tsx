import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type EnabledChainsSectionViewProps = {
  chainStatuses: Array<{
    chainId: number;
    chainName: string;
    numEntries: number;
  }>;
  enabledChainIds: number[];
  onToggleChain: (chainId: number, enabled: boolean) => void;
  isLoading: boolean;
};

/**
 * Pure view component for enabled chains section.
 * Renders toggle switches for each chain based on discovery status.
 */
export const EnabledChainsSectionView = ({
  chainStatuses,
  enabledChainIds,
  onToggleChain,
  isLoading,
}: EnabledChainsSectionViewProps) => {
  if (isLoading) {
    return (
      <div className="py-4 px-4">
        <div className="flex items-center justify-center">
          <p className="text-sm text-slate-400">Discovering chains...</p>
        </div>
      </div>
    );
  }

  if (chainStatuses.length === 0) {
    return (
      <div className="py-4 px-4">
        <p className="text-sm text-slate-400 text-center">
          No chains discovered. Connect your wallet to discover available
          chains.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {chainStatuses.map((chain) => {
        const isEnabled = enabledChainIds.includes(chain.chainId);
        const switchId = `chain-toggle-${chain.chainId}`;

        return (
          <div
            key={chain.chainId}
            className="flex items-center justify-between py-2 px-4"
          >
            <div className="flex flex-col">
              <Label htmlFor={switchId} className="text-white">
                {chain.chainName}
              </Label>
              <p className="text-xs text-slate-400 mt-1">
                {chain.numEntries === 0
                  ? "No data on this chain"
                  : `${chain.numEntries} ${chain.numEntries === 1 ? "entry" : "entries"}`}
              </p>
            </div>
            <Switch
              id={switchId}
              checked={isEnabled}
              onCheckedChange={(checked) =>
                onToggleChain(chain.chainId, checked)
              }
              aria-label={`Enable ${chain.chainName} chain`}
            />
          </div>
        );
      })}
    </div>
  );
};
