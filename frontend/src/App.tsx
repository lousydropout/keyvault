import { Button } from "@/components/ui/button";
import { ChainBanner } from "@/components/ChainBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { useExpectedChain } from "@/hooks/useExpectedChain";
import { useBatchSubmission } from "@/hooks/useBatchSubmission";

export default function App() {
  const { chainId: expectedChainId, chainName: expectedChainName, isFromUrl } =
    useExpectedChain();

  const {
    // State flags
    isWaiting,
    isSubmitting,
    isBlocked,
    isError,
    isCompleted,

    // Context
    total,
    submitted,
    remaining,
    currentBatchSize,
    expectedAddress,
    error,

    // Derived
    progress,
    blockReason,

    // Actions
    retry,
    reset,
  } = useBatchSubmission();

  return (
    <ErrorBoundary>
      <div className="flex flex-1 flex-col items-center mt-16 gap-8">
        <h1 className="text-slate-200 text-center text-4xl">
          Let's update your on-chain data!
        </h1>

        {/* Chain banner - shows expected chain and blocks if wrong chain */}
        {isFromUrl && (
          <ChainBanner
            expectedChainId={expectedChainId}
            expectedChainName={expectedChainName}
          />
        )}

        {/* Blocked: Wrong chain */}
        {isBlocked && blockReason === "chainMismatch" && (
          <p className="text-slate-400 text-lg text-center">
            Switch to {expectedChainName} to continue syncing.
          </p>
        )}

        {/* Blocked: Address mismatch */}
        {isBlocked && blockReason === "addressMismatch" && (
          <p className="text-red-300">
            Error: The data you sent is for a different account: {expectedAddress}
          </p>
        )}

        {/* Waiting for data */}
        {isWaiting && (
          <p className="text-slate-300 text-lg text-left">
            Waiting for data. . .
          </p>
        )}

        {/* Syncing progress */}
        {(isSubmitting || remaining > 0) && !isBlocked && !isError && (
          <div className="flex flex-col items-center gap-4">
            {/* Progress bar */}
            <div className="w-64 bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-slate-300 text-lg">
              Syncing: {submitted}/{total} entries
            </p>
            <p className="text-slate-400 text-sm">
              {isSubmitting
                ? `Confirming batch of ${currentBatchSize} entries...`
                : `Preparing next batch...`}
            </p>
          </div>
        )}

        {/* Error with retry */}
        {isError && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-red-400">{error}</p>
            <Button variant="outline" onClick={retry}>
              Retry batch
            </Button>
          </div>
        )}

        {/* All entries completed */}
        {isCompleted && (
          <div className="text-center">
            <p className="text-green-400 text-lg">
              All {total} {total === 1 ? "entry" : "entries"} synced successfully!
            </p>
            <p className="text-slate-400 mt-2">You can close this tab.</p>
          </div>
        )}

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
