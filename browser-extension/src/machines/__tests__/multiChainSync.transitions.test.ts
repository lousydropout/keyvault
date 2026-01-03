import { describe, it, expect } from "bun:test";
import { createActor, fromPromise } from "xstate";
import { astar, base } from "viem/chains";
import {
  multiChainSyncMachine,
  ChainSyncStatus,
} from "@/machines/multiChainSync.machine";

// Type for the discover actor output (matches machine's internal type)
type DiscoverOutput = {
  chainStatuses: Map<number, ChainSyncStatus>;
  sourceChainId: number | null;
};

// Type for the sync actor output (matches machine's internal type)
type SyncOutput = {
  success: boolean;
};

describe("multiChainSyncMachine transitions", () => {
  describe("idle state", () => {
    it("idle + DISCOVER -> discovering", () => {
      const actor = createActor(multiChainSyncMachine, {
        input: { enabledChainIds: [astar.id, base.id] },
      });
      actor.start();

      expect(actor.getSnapshot().value).toBe("idle");

      actor.send({ type: "DISCOVER" });

      expect(actor.getSnapshot().value).toBe("discovering");

      actor.stop();
    });
  });

  describe("discovering state", () => {
    it("discovering + success -> ready with chain statuses in context", async () => {
      const mockChainStatuses = new Map<number, ChainSyncStatus>([
        [astar.id, { numEntries: 10, status: "up-to-date", behind: 0 }],
        [base.id, { numEntries: 5, status: "behind", behind: 5 }],
      ]);

      const testMachine = multiChainSyncMachine.provide({
        actors: {
          discoverChainStatuses: fromPromise(
            async (): Promise<DiscoverOutput> => ({
              chainStatuses: mockChainStatuses,
              sourceChainId: astar.id,
            })
          ),
        },
      });

      const actor = createActor(testMachine, {
        input: { enabledChainIds: [astar.id, base.id] },
      });

      actor.start();
      actor.send({ type: "DISCOVER" });

      // Wait for the actor to transition to ready
      await new Promise<void>((resolve) => {
        const sub = actor.subscribe((state) => {
          if (state.value === "ready") {
            sub.unsubscribe();
            resolve();
          }
        });
      });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("ready");
      expect(snapshot.context.chainStatuses).toBeDefined();
      expect(snapshot.context.chainStatuses.get(astar.id)?.numEntries).toBe(10);
      expect(snapshot.context.chainStatuses.get(base.id)?.status).toBe(
        "behind"
      );
      expect(snapshot.context.sourceChainId).toBe(astar.id);

      actor.stop();
    });
  });

  describe("ready state", () => {
    it("ready + SYNC -> syncing with target chain in context", async () => {
      const mockChainStatuses = new Map<number, ChainSyncStatus>([
        [astar.id, { numEntries: 10, status: "up-to-date", behind: 0 }],
        [base.id, { numEntries: 5, status: "behind", behind: 5 }],
      ]);

      const testMachine = multiChainSyncMachine.provide({
        actors: {
          discoverChainStatuses: fromPromise(
            async (): Promise<DiscoverOutput> => ({
              chainStatuses: mockChainStatuses,
              sourceChainId: astar.id,
            })
          ),
          syncToChain: fromPromise(async (): Promise<SyncOutput> => {
            // Never resolves to keep in syncing state for test
            await new Promise(() => {});
            return { success: true };
          }),
        },
      });

      const actor = createActor(testMachine, {
        input: { enabledChainIds: [astar.id, base.id] },
      });

      actor.start();
      actor.send({ type: "DISCOVER" });

      // Wait for ready state
      await new Promise<void>((resolve) => {
        const sub = actor.subscribe((state) => {
          if (state.value === "ready") {
            sub.unsubscribe();
            resolve();
          }
        });
      });

      // Send SYNC event with target chain
      actor.send({ type: "SYNC", targetChainId: base.id, deltaEntries: [] });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("syncing");
      expect(snapshot.context.syncTargetChainId).toBe(base.id);

      actor.stop();
    });
  });

  describe("syncing state", () => {
    it("syncing + success -> success", async () => {
      const mockChainStatuses = new Map<number, ChainSyncStatus>([
        [astar.id, { numEntries: 10, status: "up-to-date", behind: 0 }],
        [base.id, { numEntries: 5, status: "behind", behind: 5 }],
      ]);

      const testMachine = multiChainSyncMachine.provide({
        actors: {
          discoverChainStatuses: fromPromise(
            async (): Promise<DiscoverOutput> => ({
              chainStatuses: mockChainStatuses,
              sourceChainId: astar.id,
            })
          ),
          syncToChain: fromPromise(
            async (): Promise<SyncOutput> => ({ success: true })
          ),
        },
      });

      const actor = createActor(testMachine, {
        input: { enabledChainIds: [astar.id, base.id] },
      });

      actor.start();
      actor.send({ type: "DISCOVER" });

      // Wait for ready state
      await new Promise<void>((resolve) => {
        const sub = actor.subscribe((state) => {
          if (state.value === "ready") {
            sub.unsubscribe();
            resolve();
          }
        });
      });

      // Send SYNC event
      actor.send({ type: "SYNC", targetChainId: base.id, deltaEntries: [] });

      // Wait for success state
      await new Promise<void>((resolve) => {
        const sub = actor.subscribe((state) => {
          if (state.value === "success") {
            sub.unsubscribe();
            resolve();
          }
        });
      });

      expect(actor.getSnapshot().value).toBe("success");

      actor.stop();
    });

    it("syncing + error -> error", async () => {
      const mockChainStatuses = new Map<number, ChainSyncStatus>([
        [astar.id, { numEntries: 10, status: "up-to-date", behind: 0 }],
        [base.id, { numEntries: 5, status: "behind", behind: 5 }],
      ]);

      const testMachine = multiChainSyncMachine.provide({
        actors: {
          discoverChainStatuses: fromPromise(
            async (): Promise<DiscoverOutput> => ({
              chainStatuses: mockChainStatuses,
              sourceChainId: astar.id,
            })
          ),
          syncToChain: fromPromise(async (): Promise<SyncOutput> => {
            throw new Error("Sync failed");
          }),
        },
      });

      const actor = createActor(testMachine, {
        input: { enabledChainIds: [astar.id, base.id] },
      });

      actor.start();
      actor.send({ type: "DISCOVER" });

      // Wait for ready state
      await new Promise<void>((resolve) => {
        const sub = actor.subscribe((state) => {
          if (state.value === "ready") {
            sub.unsubscribe();
            resolve();
          }
        });
      });

      // Send SYNC event
      actor.send({ type: "SYNC", targetChainId: base.id, deltaEntries: [] });

      // Wait for error state
      await new Promise<void>((resolve) => {
        const sub = actor.subscribe((state) => {
          if (state.value === "error") {
            sub.unsubscribe();
            resolve();
          }
        });
      });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("error");
      expect(snapshot.context.error).toBe("Sync failed");

      actor.stop();
    });
  });

  describe("error state", () => {
    it("error + RETRY -> syncing", async () => {
      const mockChainStatuses = new Map<number, ChainSyncStatus>([
        [astar.id, { numEntries: 10, status: "up-to-date", behind: 0 }],
        [base.id, { numEntries: 5, status: "behind", behind: 5 }],
      ]);

      let syncCallCount = 0;
      const testMachine = multiChainSyncMachine.provide({
        actors: {
          discoverChainStatuses: fromPromise(
            async (): Promise<DiscoverOutput> => ({
              chainStatuses: mockChainStatuses,
              sourceChainId: astar.id,
            })
          ),
          syncToChain: fromPromise(async (): Promise<SyncOutput> => {
            syncCallCount++;
            if (syncCallCount === 1) {
              throw new Error("Sync failed");
            }
            // On retry, never resolve to keep in syncing state
            await new Promise(() => {});
            return { success: true };
          }),
        },
      });

      const actor = createActor(testMachine, {
        input: { enabledChainIds: [astar.id, base.id] },
      });

      actor.start();
      actor.send({ type: "DISCOVER" });

      // Wait for ready state
      await new Promise<void>((resolve) => {
        const sub = actor.subscribe((state) => {
          if (state.value === "ready") {
            sub.unsubscribe();
            resolve();
          }
        });
      });

      // Send SYNC event - this will fail
      actor.send({ type: "SYNC", targetChainId: base.id, deltaEntries: [] });

      // Wait for error state
      await new Promise<void>((resolve) => {
        const sub = actor.subscribe((state) => {
          if (state.value === "error") {
            sub.unsubscribe();
            resolve();
          }
        });
      });

      expect(actor.getSnapshot().value).toBe("error");

      // Send RETRY event
      actor.send({ type: "RETRY" });

      expect(actor.getSnapshot().value).toBe("syncing");

      actor.stop();
    });
  });

  describe("RESET event", () => {
    it("RESET from any state returns to idle", async () => {
      const mockChainStatuses = new Map<number, ChainSyncStatus>([
        [astar.id, { numEntries: 10, status: "up-to-date", behind: 0 }],
      ]);

      const testMachine = multiChainSyncMachine.provide({
        actors: {
          discoverChainStatuses: fromPromise(
            async (): Promise<DiscoverOutput> => ({
              chainStatuses: mockChainStatuses,
              sourceChainId: astar.id,
            })
          ),
        },
      });

      const actor = createActor(testMachine, {
        input: { enabledChainIds: [astar.id] },
      });

      actor.start();
      actor.send({ type: "DISCOVER" });

      // Wait for ready state
      await new Promise<void>((resolve) => {
        const sub = actor.subscribe((state) => {
          if (state.value === "ready") {
            sub.unsubscribe();
            resolve();
          }
        });
      });

      expect(actor.getSnapshot().value).toBe("ready");

      // Send RESET event
      actor.send({ type: "RESET" });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("idle");
      expect(snapshot.context.chainStatuses.size).toBe(0);
      expect(snapshot.context.sourceChainId).toBeNull();
      expect(snapshot.context.syncTargetChainId).toBeNull();
      expect(snapshot.context.error).toBeNull();

      actor.stop();
    });
  });
});
