import { setup, assign, fromPromise } from "xstate";
import { Address, PublicClient, WalletClient } from "viem";

/**
 * Single encrypted entry to be stored on-chain.
 */
export type Encrypted = {
  iv: string;
  ciphertext: string;
};

/**
 * Entry context with metadata for submission.
 */
export type EntryContext = {
  address: string;
  chainId: number;
  encrypted: Encrypted;
  numEntries: number;
  overwrite?: boolean;
};

/**
 * Result from the submitBatch actor.
 */
type SubmitBatchOutput = {
  batchSize: number;
  hash: string;
};

/**
 * Input for the submitBatch actor.
 */
type SubmitBatchInput = {
  batch: EntryContext[];
  contractAddress: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
  abi: unknown;
};

/**
 * Context for the batch submission state machine.
 */
export type BatchSubmissionContext = {
  /** Full queue of entries to process */
  queue: EntryContext[];
  /** Total entries in current batch session */
  total: number;
  /** Number of entries successfully submitted */
  submitted: number;
  /** Current batch being processed */
  currentBatchSize: number;
  /** Expected wallet address */
  expectedAddress: Address | null;
  /** Expected chain ID */
  expectedChainId: number | null;
  /** Current wallet address */
  walletAddress: Address | null;
  /** Current wallet chain ID */
  walletChainId: number | null;
  /** Contract address for current chain */
  contractAddress: Address | null;
  /** Wallet client for transactions */
  walletClient: WalletClient | null;
  /** Public client for reading chain state */
  publicClient: PublicClient | null;
  /** ABI for the contract */
  abi: unknown;
  /** Last successful transaction hash */
  lastTxHash: string | null;
  /** Error message if submission failed */
  error: string | null;
};

/**
 * Events that can be sent to the batch submission machine.
 */
export type BatchSubmissionEvent =
  | {
      type: "RECEIVE_ENTRIES";
      entries: EntryContext[];
      walletAddress: Address;
      walletChainId: number;
      contractAddress: Address;
    }
  | {
      type: "WALLET_CHANGED";
      address: Address;
      chainId: number;
      walletClient: WalletClient;
      publicClient: PublicClient;
    }
  | { type: "RETRY" }
  | { type: "RESET" };

/**
 * Input for initializing the batch submission machine.
 */
export type BatchSubmissionInput = {
  walletClient: WalletClient | null;
  publicClient: PublicClient | null;
  abi: unknown;
};

const MAX_BATCH_SIZE = 20;

/**
 * Actor that submits a batch of entries to the blockchain.
 *
 * Uses viem directly for contract interaction:
 * 1. Formats ciphertexts from encrypted entries
 * 2. Calls storeEntries on the contract
 * 3. Waits for transaction confirmation
 */
const submitBatchActor = fromPromise<SubmitBatchOutput, SubmitBatchInput>(
  async ({ input }): Promise<SubmitBatchOutput> => {
    const { batch, contractAddress, walletClient, publicClient, abi } = input;

    if (!walletClient.account) {
      throw new Error("Wallet not connected");
    }

    const ciphertexts = batch.map(
      (entry) => entry.encrypted.iv + entry.encrypted.ciphertext
    );

    console.log("[submitBatchActor] Submitting batch:", {
      batchSize: batch.length,
      contractAddress,
    });

    // Submit transaction
    const hash = await walletClient.writeContract({
      abi: abi as any,
      address: contractAddress,
      functionName: "storeEntries",
      args: [ciphertexts],
      account: walletClient.account,
      chain: walletClient.chain,
    });

    console.log("[submitBatchActor] Transaction submitted:", hash);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "reverted") {
      throw new Error("Transaction reverted");
    }

    console.log("[submitBatchActor] Transaction confirmed:", receipt.status);

    return { batchSize: batch.length, hash };
  }
);

/**
 * XState v5 machine for managing batch credential submission to blockchain.
 *
 * States:
 * - waiting: Initial state, no entries received yet
 * - validating: Entries received, checking address/chain match
 * - blocked: Validation failed (wrong chain or address mismatch)
 * - submitting: Batch transaction in progress (actor invoked)
 * - advancing: Batch succeeded, deciding next action
 * - error: Transaction failed, retry available
 * - completed: All entries submitted successfully
 *
 * Events:
 * - RECEIVE_ENTRIES: New batch of entries received from extension
 * - WALLET_CHANGED: Wallet address or chain changed
 * - RETRY: Retry failed submission
 * - RESET: Clear state and return to waiting
 */
export const batchSubmissionMachine = setup({
  types: {
    context: {} as BatchSubmissionContext,
    input: {} as BatchSubmissionInput,
    events: {} as BatchSubmissionEvent,
  },
  actors: {
    submitBatch: submitBatchActor,
  },
  guards: {
    hasEntriesInQueue: ({ context }) => context.queue.length > 0,
    isValidated: ({ context }) => {
      if (!context.walletAddress || !context.expectedAddress) return false;
      if (!context.walletChainId || !context.expectedChainId) return false;
      if (!context.walletClient || !context.publicClient) return false;

      const addressMatch =
        context.walletAddress.toLowerCase() ===
        context.expectedAddress.toLowerCase();
      const chainMatch = context.walletChainId === context.expectedChainId;

      return addressMatch && chainMatch;
    },
    isAddressMismatch: ({ context }) => {
      if (!context.walletAddress || !context.expectedAddress) return false;
      return (
        context.walletAddress.toLowerCase() !==
        context.expectedAddress.toLowerCase()
      );
    },
    isChainMismatch: ({ context }) => {
      if (!context.walletChainId || !context.expectedChainId) return false;
      return context.walletChainId !== context.expectedChainId;
    },
    isQueueEmpty: ({ context }) => context.queue.length === 0,
    hasClientsReady: ({ context }) =>
      context.walletClient !== null && context.publicClient !== null,
    isMissingClients: ({ context }) =>
      context.walletClient === null || context.publicClient === null,
  },
  actions: {
    assignEntries: assign({
      queue: (_, params: { entries: EntryContext[] }) => params.entries,
      total: (_, params: { entries: EntryContext[] }) => params.entries.length,
      submitted: () => 0,
      expectedAddress: (_, params: { entries: EntryContext[] }) =>
        (params.entries[0]?.address as Address) ?? null,
      expectedChainId: (_, params: { entries: EntryContext[] }) =>
        params.entries[0]?.chainId ?? null,
    }),
    assignWallet: assign({
      walletAddress: (
        _,
        params: { address: Address; chainId: number; contractAddress: Address }
      ) => params.address,
      walletChainId: (
        _,
        params: { address: Address; chainId: number; contractAddress: Address }
      ) => params.chainId,
      contractAddress: (
        _,
        params: { address: Address; chainId: number; contractAddress: Address }
      ) => params.contractAddress,
    }),
    assignClients: assign({
      walletClient: (
        _,
        params: { walletClient: WalletClient; publicClient: PublicClient }
      ) => params.walletClient,
      publicClient: (
        _,
        params: { walletClient: WalletClient; publicClient: PublicClient }
      ) => params.publicClient,
    }),
    assignCurrentBatch: assign({
      currentBatchSize: ({ context }) =>
        Math.min(context.queue.length, MAX_BATCH_SIZE),
    }),
    advanceQueue: assign({
      queue: ({ context }, params: { batchSize: number; hash: string }) =>
        context.queue.slice(params.batchSize),
      submitted: ({ context }, params: { batchSize: number; hash: string }) =>
        context.submitted + params.batchSize,
      currentBatchSize: () => 0,
      lastTxHash: (_, params: { batchSize: number; hash: string }) =>
        params.hash,
    }),
    assignError: assign({
      error: (_, params: { message: string }) => params.message,
    }),
    clearError: assign({
      error: () => null,
    }),
    resetContext: assign({
      queue: () => [],
      total: () => 0,
      submitted: () => 0,
      currentBatchSize: () => 0,
      expectedAddress: () => null,
      expectedChainId: () => null,
      lastTxHash: () => null,
      error: () => null,
    }),
  },
}).createMachine({
  id: "batchSubmission",
  initial: "waiting",
  context: ({ input }) => ({
    queue: [],
    total: 0,
    submitted: 0,
    currentBatchSize: 0,
    expectedAddress: null,
    expectedChainId: null,
    walletAddress: null,
    walletChainId: null,
    contractAddress: null,
    walletClient: input.walletClient,
    publicClient: input.publicClient,
    abi: input.abi,
    lastTxHash: null,
    error: null,
  }),
  on: {
    RESET: {
      target: ".waiting",
      actions: "resetContext",
    },
  },
  states: {
    waiting: {
      on: {
        RECEIVE_ENTRIES: {
          target: "validating",
          actions: [
            {
              type: "assignEntries",
              params: ({ event }) => ({ entries: event.entries }),
            },
            {
              type: "assignWallet",
              params: ({ event }) => ({
                address: event.walletAddress,
                chainId: event.walletChainId,
                contractAddress: event.contractAddress,
              }),
            },
          ],
        },
        WALLET_CHANGED: {
          actions: [
            {
              type: "assignClients",
              params: ({ event }) => ({
                walletClient: event.walletClient,
                publicClient: event.publicClient,
              }),
            },
          ],
        },
      },
    },

    validating: {
      always: [
        {
          target: "submitting",
          guard: "isValidated",
          actions: "assignCurrentBatch",
        },
        {
          target: "blocked",
          guard: "isAddressMismatch",
        },
        {
          target: "blocked",
          guard: "isChainMismatch",
        },
        {
          // Clients not ready yet - wait in blocked state
          target: "blocked",
          guard: "isMissingClients",
        },
      ],
      on: {
        WALLET_CHANGED: {
          target: "validating",
          actions: [
            {
              type: "assignWallet",
              params: ({ event, context }) => ({
                address: event.address,
                chainId: event.chainId,
                contractAddress: context.contractAddress!,
              }),
            },
            {
              type: "assignClients",
              params: ({ event }) => ({
                walletClient: event.walletClient,
                publicClient: event.publicClient,
              }),
            },
          ],
          reenter: true,
        },
      },
    },

    blocked: {
      on: {
        WALLET_CHANGED: {
          target: "validating",
          actions: [
            {
              type: "assignWallet",
              params: ({ event, context }) => ({
                address: event.address,
                chainId: event.chainId,
                contractAddress: context.contractAddress!,
              }),
            },
            {
              type: "assignClients",
              params: ({ event }) => ({
                walletClient: event.walletClient,
                publicClient: event.publicClient,
              }),
            },
          ],
        },
        RESET: {
          target: "waiting",
          actions: "resetContext",
        },
      },
    },

    submitting: {
      invoke: {
        src: "submitBatch",
        input: ({ context }) => ({
          batch: context.queue.slice(0, MAX_BATCH_SIZE),
          contractAddress: context.contractAddress!,
          walletClient: context.walletClient!,
          publicClient: context.publicClient!,
          abi: context.abi,
        }),
        onDone: {
          target: "advancing",
          actions: [
            "clearError",
            {
              type: "advanceQueue",
              params: ({ event }) => ({
                batchSize: event.output.batchSize,
                hash: event.output.hash,
              }),
            },
          ],
        },
        onError: {
          target: "error",
          actions: {
            type: "assignError",
            params: ({ event }) => ({
              message:
                event.error instanceof Error
                  ? event.error.message
                  : "Transaction failed",
            }),
          },
        },
      },
    },

    advancing: {
      always: [
        {
          target: "completed",
          guard: "isQueueEmpty",
        },
        {
          target: "submitting",
          guard: "hasEntriesInQueue",
          actions: "assignCurrentBatch",
        },
      ],
    },

    error: {
      on: {
        RETRY: {
          target: "submitting",
          actions: ["clearError", "assignCurrentBatch"],
        },
        RESET: {
          target: "waiting",
          actions: "resetContext",
        },
      },
    },

    completed: {
      on: {
        RECEIVE_ENTRIES: {
          target: "validating",
          actions: [
            {
              type: "assignEntries",
              params: ({ event }) => ({ entries: event.entries }),
            },
            {
              type: "assignWallet",
              params: ({ event }) => ({
                address: event.walletAddress,
                chainId: event.walletChainId,
                contractAddress: event.contractAddress,
              }),
            },
          ],
        },
        RESET: {
          target: "waiting",
          actions: "resetContext",
        },
      },
    },
  },
});

export type BatchSubmissionMachine = typeof batchSubmissionMachine;

/**
 * Helper to get blocking reason from context.
 */
export const getBlockReason = (
  context: BatchSubmissionContext
): "addressMismatch" | "chainMismatch" | null => {
  if (!context.walletAddress || !context.expectedAddress) return null;

  if (
    context.walletAddress.toLowerCase() !==
    context.expectedAddress.toLowerCase()
  ) {
    return "addressMismatch";
  }

  if (context.walletChainId !== context.expectedChainId) {
    return "chainMismatch";
  }

  return null;
};

/**
 * Calculate progress percentage.
 */
export const getProgress = (context: BatchSubmissionContext): number => {
  if (context.total === 0) return 0;
  return (context.submitted / context.total) * 100;
};
