import { useMachine } from "@xstate/react";
import { useEffect, useCallback, useRef } from "react";
import { useAccount, useChainId, useWalletClient, usePublicClient } from "wagmi";
import { Address } from "viem";
import {
  batchSubmissionMachine,
  EntryContext,
  getBlockReason,
  getProgress,
} from "@/machines/batchSubmission.machine";
import { abi, getContractAddress } from "@/config";
import { useMessage } from "./useMessage";
import { useToast } from "./use-toast";

/**
 * Hook that orchestrates batch submission using XState.
 *
 * This is a thin wrapper that:
 * - Provides wallet/public clients to the machine
 * - Syncs wallet changes
 * - Listens for extension messages
 * - Shows toast notifications
 *
 * All state logic is handled by the XState machine.
 */
export function useBatchSubmission() {
  const { toast } = useToast();
  const account = useAccount();
  const walletChainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { queue: messageQueue, total: messageTotal, advance } = useMessage();

  // Track previous values to detect changes
  const prevTotalRef = useRef(0);
  const prevSubmittedRef = useRef(0);

  const [state, send] = useMachine(batchSubmissionMachine, {
    input: {
      walletClient: walletClient ?? null,
      publicClient: publicClient ?? null,
      abi,
    },
  });

  const { context } = state;
  const contractAddress = getContractAddress(
    context.expectedChainId ?? walletChainId
  );

  // Sync wallet/client changes to the machine
  useEffect(() => {
    if (account.address && walletClient && publicClient) {
      send({
        type: "WALLET_CHANGED",
        address: account.address as Address,
        chainId: walletChainId,
        walletClient,
        publicClient,
      });
    }
  }, [account.address, walletChainId, walletClient, publicClient, send]);

  // Receive entries from extension (only when messageTotal changes)
  useEffect(() => {
    if (messageTotal > 0 && messageTotal !== prevTotalRef.current && account.address) {
      prevTotalRef.current = messageTotal;

      send({
        type: "RECEIVE_ENTRIES",
        entries: messageQueue as EntryContext[],
        walletAddress: account.address as Address,
        walletChainId,
        contractAddress,
      });

      toast({
        description: `Received ${messageQueue.length} ${messageQueue.length === 1 ? "entry" : "entries"}.`,
      });
    }
  }, [messageTotal, messageQueue, account.address, walletChainId, contractAddress, send, toast]);

  // Show toast on batch success (when submitted count increases)
  useEffect(() => {
    if (context.submitted > prevSubmittedRef.current) {
      const batchSize = context.submitted - prevSubmittedRef.current;
      prevSubmittedRef.current = context.submitted;

      toast({
        description: `Saved ${batchSize} ${batchSize === 1 ? "entry" : "entries"}!`,
      });

      // Advance the message queue to stay in sync
      advance(batchSize);
    }
  }, [context.submitted, advance, toast]);

  // Reset ref when total resets (new batch session)
  useEffect(() => {
    if (context.total === 0) {
      prevSubmittedRef.current = 0;
    }
  }, [context.total]);

  // Retry handler
  const retry = useCallback(() => {
    send({ type: "RETRY" });
  }, [send]);

  // Reset handler
  const reset = useCallback(() => {
    send({ type: "RESET" });
    prevTotalRef.current = 0;
    prevSubmittedRef.current = 0;
  }, [send]);

  return {
    // State
    state: state.value,
    isWaiting: state.matches("waiting"),
    isValidating: state.matches("validating"),
    isBlocked: state.matches("blocked"),
    isSubmitting: state.matches("submitting"),
    isAdvancing: state.matches("advancing"),
    isError: state.matches("error"),
    isCompleted: state.matches("completed"),

    // Context
    queue: context.queue,
    total: context.total,
    submitted: context.submitted,
    remaining: context.queue.length,
    currentBatchSize: context.currentBatchSize,
    expectedAddress: context.expectedAddress,
    expectedChainId: context.expectedChainId,
    error: context.error,
    lastTxHash: context.lastTxHash,

    // Derived
    progress: getProgress(context),
    blockReason: getBlockReason(context),

    // Actions
    retry,
    reset,
  };
}
