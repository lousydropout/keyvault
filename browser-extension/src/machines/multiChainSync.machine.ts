import { setup, assign, fromPromise } from "xstate";
import { discoverAccounts, ChainAccountInfo } from "@/utils/discoverAccounts";
import { getChainWithMostEntries } from "@/utils/enabledChainsUtils";
import { Encrypted } from "@/utils/encryption";
import { Hex } from "viem";

/**
 * Status information for a single chain's sync state.
 */
export type ChainSyncStatus = {
  numEntries: number;
  status: "up-to-date" | "behind";
  behind: number;
};

/**
 * Context for the multi-chain sync state machine.
 */
export type MultiChainSyncContext = {
  enabledChainIds: number[];
  chainStatuses: Map<number, ChainSyncStatus>;
  sourceChainId: number | null;
  syncTargetChainId: number | null;
  pubkey: Hex | null;
  error: string | null;
};

/**
 * Input for initializing the multi-chain sync machine.
 */
export type MultiChainSyncInput = {
  enabledChainIds: number[];
};

/**
 * Events that can be sent to the multi-chain sync machine.
 */
export type MultiChainSyncEvent =
  | { type: "DISCOVER"; pubkey?: Hex; enabledChainIds?: number[] }
  | { type: "SYNC"; targetChainId: number; deltaEntries: Encrypted[]; address: Hex }
  | { type: "RETRY" }
  | { type: "RESET" };

/**
 * Output from the discoverChainStatuses actor.
 */
type DiscoverOutput = {
  chainStatuses: Map<number, ChainSyncStatus>;
  sourceChainId: number | null;
};

/**
 * Input for the discoverChainStatuses actor.
 */
type DiscoverInput = {
  enabledChainIds: number[];
  pubkey?: Hex;
};

/**
 * Output from the syncToChain actor.
 */
type SyncOutput = {
  success: boolean;
};

/**
 * Input for the syncToChain actor.
 */
type SyncInput = {
  targetChainId: number;
  deltaEntries: Encrypted[];
  address: Hex;
  numEntries: number;
};

/**
 * Calculates which entries are missing from the target chain.
 *
 * Since credential lists are append-only and identical across chains,
 * missing entries are simply the ones at the end of the source list.
 *
 * @param sourceEncrypteds - Full list of encrypted entries from source chain
 * @param targetNumEntries - Number of entries already on target chain
 * @returns Array of encrypted entries missing from target chain
 */
export const calculateDeltaEntries = (
  sourceEncrypteds: Encrypted[],
  targetNumEntries: number
): Encrypted[] => {
  if (targetNumEntries >= sourceEncrypteds.length) {
    return [];
  }
  return sourceEncrypteds.slice(targetNumEntries);
};

/**
 * Actor that discovers chain statuses across all enabled chains.
 *
 * Queries numEntries for each enabled chain and calculates which chains
 * are behind relative to the chain with the most entries.
 */
const discoverChainStatusesActor = fromPromise<DiscoverOutput, DiscoverInput>(
  async ({ input }): Promise<DiscoverOutput> => {
    const { enabledChainIds, pubkey } = input;

    if (!pubkey) {
      throw new Error("Public key required for chain discovery");
    }

    const result = await discoverAccounts(pubkey, enabledChainIds);

    // Find max entries across all chains
    const maxEntries = result.accounts.reduce(
      (max, account) => Math.max(max, account.numEntries),
      0
    );

    // Build chain statuses map
    const chainStatuses = new Map<number, ChainSyncStatus>();

    for (const chainId of enabledChainIds) {
      const account = result.accounts.find((a) => a.chainId === chainId);
      const numEntries = account?.numEntries ?? 0;
      const behind = maxEntries - numEntries;

      chainStatuses.set(chainId, {
        numEntries,
        status: behind === 0 ? "up-to-date" : "behind",
        behind,
      });
    }

    // Determine source chain (chain with most entries)
    const sourceChainId = getChainWithMostEntries(result.accounts);

    return { chainStatuses, sourceChainId };
  }
);

/**
 * Actor that syncs delta entries to a target chain via Chrome messaging.
 *
 * Sends all missing entries in a single batch message to the dApp page.
 * The frontend handles submitting each entry as a blockchain transaction.
 */
const syncToChainActor = fromPromise<SyncOutput, SyncInput>(
  async ({ input }): Promise<SyncOutput> => {
    const { targetChainId, deltaEntries, address, numEntries } = input;

    console.log("[syncToChainActor] Starting sync:", {
      targetChainId,
      address,
      numEntries,
      deltaEntriesCount: deltaEntries.length,
    });

    if (deltaEntries.length === 0) {
      console.log("[syncToChainActor] No delta entries to sync");
      return { success: true };
    }

    // Get active tab for Chrome messaging
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    console.log("[syncToChainActor] Active tab:", tab);

    if (!tab?.id) {
      throw new Error("No active tab found for sync");
    }

    // Send all entries in a single batch message
    const data = {
      encrypteds: deltaEntries,
      address,
      startIndex: numEntries,
      chainId: targetChainId,
    };

    console.log("[syncToChainActor] Sending batch to tab", tab.id, "entries:", deltaEntries.length);

    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "FROM_EXTENSION",
        data,
      });
      console.log("[syncToChainActor] Batch sent successfully");
    } catch (error) {
      console.error("[syncToChainActor] Error sending batch:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // Handle expected cases where content script isn't available
      if (
        errorMessage.includes("Receiving end does not exist") ||
        errorMessage.includes("Could not establish connection")
      ) {
        throw new Error(
          "Content script not available. Please refresh the dApp page."
        );
      }
      throw error;
    }

    return { success: true };
  }
);

/**
 * XState v5 machine for managing multi-chain credential synchronization.
 *
 * States:
 * - idle: Initial state, waiting for discovery trigger
 * - discovering: Querying chain statuses across enabled chains
 * - ready: Chain statuses loaded, waiting for sync action
 * - syncing: Sending delta entries to target chain
 * - success: Sync completed successfully
 * - error: An error occurred during discovery or sync
 *
 * Events:
 * - DISCOVER: Start chain status discovery
 * - SYNC: Begin syncing to a specific target chain
 * - RETRY: Retry the last failed sync operation
 * - RESET: Return to idle state and clear context
 */
export const multiChainSyncMachine = setup({
  types: {
    context: {} as MultiChainSyncContext,
    input: {} as MultiChainSyncInput,
    events: {} as MultiChainSyncEvent,
  },
  actors: {
    discoverChainStatuses: discoverChainStatusesActor,
    syncToChain: syncToChainActor,
  },
  actions: {
    assignDiscoverResult: assign({
      chainStatuses: (_, params: DiscoverOutput) => params.chainStatuses,
      sourceChainId: (_, params: DiscoverOutput) => params.sourceChainId,
    }),
    assignPubkey: assign({
      pubkey: (_, params: { pubkey: Hex }) => params.pubkey,
    }),
    assignEnabledChainIds: assign({
      enabledChainIds: (_, params: { enabledChainIds: number[] }) =>
        params.enabledChainIds,
    }),
    assignSyncTarget: assign({
      syncTargetChainId: (
        _,
        params: { targetChainId: number; deltaEntries: Encrypted[] }
      ) => params.targetChainId,
    }),
    assignError: assign({
      error: (_, params: { message: string }) => params.message,
    }),
    clearError: assign({
      error: () => null,
    }),
    resetContext: assign({
      chainStatuses: () => new Map<number, ChainSyncStatus>(),
      sourceChainId: () => null,
      syncTargetChainId: () => null,
      pubkey: () => null,
      error: () => null,
    }),
  },
}).createMachine({
  id: "multiChainSync",
  initial: "idle",
  context: ({ input }) => ({
    enabledChainIds: input.enabledChainIds,
    chainStatuses: new Map<number, ChainSyncStatus>(),
    sourceChainId: null,
    syncTargetChainId: null,
    pubkey: null,
    error: null,
  }),
  on: {
    RESET: {
      target: ".idle",
      actions: "resetContext",
    },
  },
  states: {
    idle: {
      on: {
        DISCOVER: {
          target: "discovering",
          actions: [
            {
              type: "assignPubkey",
              params: ({ event }) => ({ pubkey: event.pubkey! }),
            },
            {
              type: "assignEnabledChainIds",
              params: ({ event }) => ({
                enabledChainIds: event.enabledChainIds ?? [],
              }),
            },
          ],
        },
      },
    },
    discovering: {
      invoke: {
        src: "discoverChainStatuses",
        input: ({ context, event }) => ({
          // Prefer event's enabledChainIds (fresh from hook) over context
          enabledChainIds:
            event.type === "DISCOVER" && event.enabledChainIds?.length
              ? event.enabledChainIds
              : context.enabledChainIds,
          // Use event pubkey if available, otherwise fall back to context (for auto-refresh)
          pubkey:
            event.type === "DISCOVER" ? event.pubkey : context.pubkey ?? undefined,
        }),
        onDone: {
          target: "ready",
          actions: {
            type: "assignDiscoverResult",
            params: ({ event }) => event.output,
          },
        },
        onError: {
          target: "error",
          actions: {
            type: "assignError",
            params: ({ event }) => ({
              message:
                event.error instanceof Error
                  ? event.error.message
                  : "Discovery failed",
            }),
          },
        },
      },
    },
    ready: {
      on: {
        SYNC: {
          target: "syncing",
          actions: {
            type: "assignSyncTarget",
            params: ({ event }) => ({
              targetChainId: event.targetChainId,
              deltaEntries: event.deltaEntries,
            }),
          },
        },
        DISCOVER: {
          target: "discovering",
          actions: [
            {
              type: "assignPubkey",
              params: ({ event }) => ({ pubkey: event.pubkey! }),
            },
            {
              type: "assignEnabledChainIds",
              params: ({ event }) => ({
                enabledChainIds: event.enabledChainIds ?? [],
              }),
            },
          ],
        },
      },
    },
    syncing: {
      invoke: {
        src: "syncToChain",
        input: ({ context, event }) => {
          // Get target chain info from the SYNC event stored in context
          const targetChainId = context.syncTargetChainId!;
          const targetStatus = context.chainStatuses.get(targetChainId);

          // Extract deltaEntries and address from the triggering SYNC event
          const syncEvent = event as Extract<
            MultiChainSyncEvent,
            { type: "SYNC" }
          >;

          return {
            targetChainId,
            deltaEntries: syncEvent.deltaEntries ?? [],
            address: syncEvent.address,
            numEntries: targetStatus?.numEntries ?? 0,
          };
        },
        onDone: {
          target: "success",
          actions: "clearError",
        },
        onError: {
          target: "error",
          actions: {
            type: "assignError",
            params: ({ event }) => ({
              message:
                event.error instanceof Error
                  ? event.error.message
                  : "Sync failed",
            }),
          },
        },
      },
    },
    success: {
      // Auto-refresh chain statuses after successful sync
      after: {
        500: "discovering",
      },
      on: {
        DISCOVER: {
          target: "discovering",
          actions: [
            {
              type: "assignPubkey",
              params: ({ event }) => ({ pubkey: event.pubkey! }),
            },
            {
              type: "assignEnabledChainIds",
              params: ({ event }) => ({
                enabledChainIds: event.enabledChainIds ?? [],
              }),
            },
          ],
        },
        SYNC: {
          target: "syncing",
          actions: {
            type: "assignSyncTarget",
            params: ({ event }) => ({
              targetChainId: event.targetChainId,
              deltaEntries: event.deltaEntries,
            }),
          },
        },
        RESET: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
    error: {
      on: {
        RETRY: "syncing",
        DISCOVER: {
          target: "discovering",
          actions: [
            {
              type: "assignPubkey",
              params: ({ event }) => ({ pubkey: event.pubkey! }),
            },
            {
              type: "assignEnabledChainIds",
              params: ({ event }) => ({
                enabledChainIds: event.enabledChainIds ?? [],
              }),
            },
          ],
        },
        RESET: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
  },
});

export type MultiChainSyncMachine = typeof multiChainSyncMachine;
