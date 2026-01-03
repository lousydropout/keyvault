import { Button } from "@/components/ui/button";
import { ChainBanner } from "@/components/ChainBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastAction } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { abi, getContractAddress } from "@/config";
import { useToast } from "@/hooks/use-toast";
import { useExpectedChain } from "@/hooks/useExpectedChain";
import { useMessage } from "@/hooks/useMessage";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";

export default function App() {
  const { current: message, total, remaining, next } = useMessage();
  const account = useAccount();
  const walletChainId = useChainId();
  const { toast } = useToast();
  const [isOkay, setIsOkay] = useState<boolean>(false);
  const [ciphertext, setCiphertext] = useState<string>("");
  const { writeContract, isPending, isSuccess, error, reset } = useWriteContract();
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Get expected chain from URL query param
  const { chainId: expectedChainId, chainName: expectedChainName, isFromUrl } = useExpectedChain();

  // Check if wallet is on the correct chain
  const isCorrectChain = walletChainId === expectedChainId;

  // Get contract address for the expected chain
  const contractAddress = useMemo(() => getContractAddress(expectedChainId), [expectedChainId]);

  // Progress indicator for batch operations
  const progress = total > 0 ? `${total - remaining + 1}/${total}` : "";

  const submit = async (ciphertext: string) => {
    if (!account?.address) return;
    writeContract({
      abi,
      address: contractAddress,
      functionName: "storeEntry",
      args: [ciphertext],
    });
    setSubmitted(true);
  };

  // Handle successful submission - advance to next entry
  useEffect(() => {
    if (isSuccess) {
      toast({ description: `Entry ${total - remaining + 1}/${total} saved!` });
      // Reset for next entry and advance queue
      reset();
      setSubmitted(false);
      setCiphertext("");
      next();
    }
  }, [isSuccess, total, remaining, next, reset, toast]);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: error?.name,
        description: "Would you like to retry?",
        action: (
          <ToastAction altText="Try again" onClick={() => submit(ciphertext)}>
            Resubmit
          </ToastAction>
        ),
      });
      console.log("error: ", error);
    }
  }, [error]);

  // Track if we've shown the "received" toast for current batch
  const [batchReceived, setBatchReceived] = useState(false);

  // Show toast only once when new batch arrives
  useEffect(() => {
    if (total > 0 && !batchReceived) {
      toast({ description: `Received ${total} ${total === 1 ? "entry" : "entries"}.` });
      setBatchReceived(true);
    }
    // Reset when batch completes
    if (total > 0 && remaining === 0) {
      setBatchReceived(false);
    }
  }, [total, remaining, batchReceived, toast]);

  // Validate message when it changes
  useEffect(() => {
    if (account && message) {
      setIsOkay(
        account?.address?.toLowerCase() === message?.address?.toLowerCase() && isCorrectChain
      );
    }
  }, [message, account, isCorrectChain]);

  // Set ciphertext when message is valid
  useEffect(() => {
    if (!isOkay) return;

    const encrypted = message?.encrypted;
    if (!encrypted) return;
    setCiphertext(encrypted.iv + encrypted.ciphertext);
  }, [isOkay, message]);

  // Auto-submit when ciphertext is ready and not already pending/errored
  useEffect(() => {
    if (ciphertext && isOkay && !isPending && !error && !submitted) {
      console.log("[Auto-submit] Submitting entry", total - remaining + 1, "of", total);
      submit(ciphertext);
    }
  }, [ciphertext, isOkay, isPending, error, submitted, total, remaining]);

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

        {/* Block all interactions if on wrong chain */}
        {!isCorrectChain && isFromUrl ? (
          <p className="text-slate-400 text-lg text-center">
            Switch to {expectedChainName} to continue syncing.
          </p>
        ) : (
          <>
            {/* Auto-sync progress */}
            {message && isOkay && remaining > 0 && (
              <div className="flex flex-col items-center gap-4">
                {/* Progress bar */}
                <div className="w-64 bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all duration-300"
                    style={{ width: `${((total - remaining) / total) * 100}%` }}
                  />
                </div>
                <p className="text-slate-300 text-lg">
                  Syncing: {total - remaining}/{total} entries
                </p>
                <p className="text-slate-400 text-sm">
                  {isPending
                    ? `Confirming entry ${total - remaining + 1}...`
                    : `Preparing entry ${total - remaining + 1}...`}
                </p>
              </div>
            )}

            {/* Error with retry */}
            {error && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-red-400">{error.message}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    reset();
                    setSubmitted(false);
                  }}
                >
                  Retry entry {total - remaining + 1}
                </Button>
              </div>
            )}

            {/* Address mismatch error */}
            {message && !isOkay && (
              <div className="text-slate-300 text-lg text-left">
                {account?.address?.toLowerCase() !== message?.address?.toLowerCase() && (
                  <p className="text-red-300">
                    Error: The data you sent is for a different account:{" "}
                    {message?.address}
                  </p>
                )}
              </div>
            )}

            {/* Waiting state */}
            {!submitted && !message && remaining === 0 && (
              <p className="text-slate-300 text-lg text-left">
                Waiting for data. . .
              </p>
            )}

            {/* All entries completed */}
            {remaining === 0 && total > 0 && (
              <div className="text-center">
                <p className="text-green-400 text-lg">
                  All {total} {total === 1 ? "entry" : "entries"} synced successfully!
                </p>
                <p className="text-slate-400 mt-2">
                  You can close this tab.
                </p>
              </div>
            )}
          </>
        )}

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
