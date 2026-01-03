import { Button } from "@/components/ui/button";
import { CHAIN_CONFIGS } from "@/constants/chains";
import { ChainSyncStatus } from "@/machines/multiChainSync.machine";

/**
 * Helper functions for MultiChainSync component.
 * Exported for testing.
 */
export const multiChainSyncHelpers = {
  /**
   * Get status display text for a chain.
   */
  getStatusText: (status: ChainSyncStatus): string => {
    if (status.status === "up-to-date") {
      return "Up to date";
    }
    const entries = status.behind === 1 ? "entry" : "entries";
    return `${status.behind} ${entries} behind`;
  },

  /**
   * Determine if sync button should be disabled for a chain.
   */
  isSyncDisabled: (
    status: ChainSyncStatus | undefined,
    isSyncing: boolean
  ): boolean => {
    if (!status) return true;
    if (isSyncing) return true;
    return status.status === "up-to-date";
  },

  /**
   * Get status indicator color class.
   */
  getStatusColorClass: (status: ChainSyncStatus | undefined): string => {
    if (!status) return "bg-gray-400";
    return status.status === "up-to-date" ? "bg-green-500" : "bg-yellow-500";
  },

  /**
   * Get status text color class.
   */
  getStatusTextColorClass: (status: ChainSyncStatus | undefined): string => {
    if (!status) return "text-gray-400";
    return status.status === "up-to-date" ? "text-green-400" : "text-yellow-400";
  },
};

/**
 * Props for ChainSyncRow presentational component.
 */
type ChainSyncRowProps = {
  chainId: number;
  chainName: string;
  status: ChainSyncStatus | undefined;
  isSyncing: boolean;
  isCurrentSyncTarget: boolean;
  onOpenFrontend: () => void;
  onPush: () => void;
};

/**
 * Presentational component for a single chain's sync row.
 */
export const ChainSyncRow = ({
  chainId,
  chainName,
  status,
  isSyncing,
  isCurrentSyncTarget,
  onOpenFrontend,
  onPush,
}: ChainSyncRowProps) => {
  const statusText = status
    ? multiChainSyncHelpers.getStatusText(status)
    : "Loading...";
  const colorClass = multiChainSyncHelpers.getStatusColorClass(status);
  const textColorClass = multiChainSyncHelpers.getStatusTextColorClass(status);
  const isPushDisabled = multiChainSyncHelpers.isSyncDisabled(status, isSyncing);

  return (
    <div
      className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
      data-chain-id={chainId}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${colorClass}`} />
        <div>
          <div className="text-white font-medium">{chainName}</div>
          <div className={`text-sm ${textColorClass}`}>{statusText}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFrontend}
          disabled={isPushDisabled}
          className="bg-slate-600 hover:bg-slate-500 text-white hover:text-white disabled:bg-gray-700 disabled:text-gray-500"
        >
          Open
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onPush}
          disabled={isPushDisabled}
          className="bg-purple-500 hover:bg-purple-600 active:bg-purple-800 text-white hover:text-white disabled:bg-gray-600 disabled:text-gray-400"
        >
          {isCurrentSyncTarget && isSyncing ? "Pushing..." : "Push"}
        </Button>
      </div>
    </div>
  );
};

/**
 * Props for MultiChainSyncView presentational component.
 */
export type MultiChainSyncViewProps = {
  enabledChainIds: number[];
  chainStatuses: Map<number, ChainSyncStatus>;
  isDiscovering: boolean;
  isSyncing: boolean;
  syncTargetChainId: number | null;
  error: string | null;
  onOpenFrontend: (chainId: number) => void;
  onPush: (chainId: number) => void;
  onRetry: () => void;
  onDiscover: () => void;
};

/**
 * Presentational component for the multi-chain sync view.
 */
export const MultiChainSyncView = ({
  enabledChainIds,
  chainStatuses,
  isDiscovering,
  isSyncing,
  syncTargetChainId,
  error,
  onOpenFrontend,
  onPush,
  onRetry,
  onDiscover,
}: MultiChainSyncViewProps) => {
  if (enabledChainIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-start gap-2 p-4">
        <h1 className="mb-8 text-4xl text-white">Sync</h1>
        <p className="text-slate-400 text-center">
          No chains enabled. Enable chains in Settings to sync credentials.
        </p>
      </div>
    );
  }

  if (isDiscovering) {
    return (
      <div className="flex flex-col items-center justify-start gap-2 p-4">
        <h1 className="mb-8 text-4xl text-white">Sync</h1>
        <p className="text-slate-400">Discovering chain statuses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-start gap-4 p-4">
        <h1 className="mb-4 text-4xl text-white">Sync</h1>
        <p className="text-red-400 text-center">{error}</p>
        <Button
          variant="outline"
          onClick={onRetry}
          className="bg-purple-500 hover:bg-purple-600 text-white hover:text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start gap-4 p-4">
      <h1 className="mb-4 text-4xl text-white">Sync</h1>
      <div className="w-full max-w-md space-y-3">
        {enabledChainIds.map((chainId) => {
          const config = CHAIN_CONFIGS[chainId];
          if (!config) return null;

          return (
            <ChainSyncRow
              key={chainId}
              chainId={chainId}
              chainName={config.name}
              status={chainStatuses.get(chainId)}
              isSyncing={isSyncing}
              isCurrentSyncTarget={syncTargetChainId === chainId}
              onOpenFrontend={() => onOpenFrontend(chainId)}
              onPush={() => onPush(chainId)}
            />
          );
        })}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDiscover}
        disabled={isDiscovering}
        className="text-slate-400 hover:text-white mt-4"
      >
        Refresh Status
      </Button>
    </div>
  );
};
