import { describe, it, expect, vi } from "vitest";
import { createActor, fromPromise, waitFor } from "xstate";
import {
  batchSubmissionMachine,
  EntryContext,
  getBlockReason,
  getProgress,
} from "../batchSubmission.machine";

// Mock wallet and public clients
const mockWalletClient = {
  account: { address: "0x1234567890123456789012345678901234567890" },
  chain: { id: 1 },
  writeContract: vi.fn(),
} as any;

const mockPublicClient = {
  waitForTransactionReceipt: vi.fn(),
} as any;

const mockAbi = [{ name: "storeEntries" }];

// Helper to create test entries
const createTestEntries = (count: number, address = "0x1234567890123456789012345678901234567890"): EntryContext[] =>
  Array.from({ length: count }, (_, i) => ({
    address,
    chainId: 1,
    encrypted: { iv: `iv${i}`, ciphertext: `cipher${i}` },
    numEntries: i,
  }));

describe("batchSubmissionMachine", () => {
  describe("State Transitions", () => {
    it("starts in waiting state", () => {
      const actor = createActor(batchSubmissionMachine, {
        input: { walletClient: null, publicClient: null, abi: mockAbi },
      });
      actor.start();

      expect(actor.getSnapshot().value).toBe("waiting");
      actor.stop();
    });

    it("waiting → validating on RECEIVE_ENTRIES", () => {
      const actor = createActor(batchSubmissionMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(5),
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 1,
        contractAddress: "0xcontract",
      });

      // Should transition through validating to submitting (if validated)
      expect(actor.getSnapshot().context.queue).toHaveLength(5);
      expect(actor.getSnapshot().context.total).toBe(5);
      actor.stop();
    });

    it("validating → blocked on address mismatch", () => {
      const actor = createActor(batchSubmissionMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      // Send entries for different address
      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(5, "0xdifferentaddress"),
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 1,
        contractAddress: "0xcontract",
      });

      expect(actor.getSnapshot().value).toBe("blocked");
      actor.stop();
    });

    it("validating → blocked on chain mismatch", () => {
      const actor = createActor(batchSubmissionMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(5), // entries expect chainId 1
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 42, // different chain
        contractAddress: "0xcontract",
      });

      expect(actor.getSnapshot().value).toBe("blocked");
      actor.stop();
    });

    it("blocked → validating on WALLET_CHANGED", () => {
      const actor = createActor(batchSubmissionMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      // First, get to blocked state
      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(5),
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 42, // wrong chain
        contractAddress: "0xcontract",
      });
      expect(actor.getSnapshot().value).toBe("blocked");

      // Now switch to correct chain
      actor.send({
        type: "WALLET_CHANGED",
        address: "0x1234567890123456789012345678901234567890",
        chainId: 1, // correct chain
        walletClient: mockWalletClient,
        publicClient: mockPublicClient,
      });

      // Should now be submitting (validated successfully)
      expect(actor.getSnapshot().value).toBe("submitting");
      actor.stop();
    });

    it("validating → submitting when validated", async () => {
      // Create machine with mocked actor that succeeds immediately
      const testMachine = batchSubmissionMachine.provide({
        actors: {
          submitBatch: fromPromise(async () => ({ batchSize: 5, hash: "0xhash" })),
        },
      });

      const actor = createActor(testMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(5),
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 1,
        contractAddress: "0xcontract",
      });

      // Should transition to submitting
      expect(actor.getSnapshot().value).toBe("submitting");
      actor.stop();
    });

    it("submitting → advancing → completed on success", async () => {
      const testMachine = batchSubmissionMachine.provide({
        actors: {
          submitBatch: fromPromise(async () => ({ batchSize: 5, hash: "0xhash123" })),
        },
      });

      const actor = createActor(testMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(5),
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 1,
        contractAddress: "0xcontract",
      });

      // Wait for completion
      await waitFor(actor, (state) => state.value === "completed");

      expect(actor.getSnapshot().value).toBe("completed");
      expect(actor.getSnapshot().context.submitted).toBe(5);
      expect(actor.getSnapshot().context.queue).toHaveLength(0);
      expect(actor.getSnapshot().context.lastTxHash).toBe("0xhash123");
      actor.stop();
    });

    it("submitting → error on failure", async () => {
      const testMachine = batchSubmissionMachine.provide({
        actors: {
          submitBatch: fromPromise(async () => {
            throw new Error("Transaction reverted");
          }),
        },
      });

      const actor = createActor(testMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(5),
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 1,
        contractAddress: "0xcontract",
      });

      // Wait for error state
      await waitFor(actor, (state) => state.value === "error");

      expect(actor.getSnapshot().value).toBe("error");
      expect(actor.getSnapshot().context.error).toBe("Transaction reverted");
      // Queue should remain intact for retry
      expect(actor.getSnapshot().context.queue).toHaveLength(5);
      actor.stop();
    });

    it("error → submitting on RETRY", async () => {
      let callCount = 0;
      const testMachine = batchSubmissionMachine.provide({
        actors: {
          submitBatch: fromPromise(async () => {
            callCount++;
            if (callCount === 1) {
              throw new Error("First attempt failed");
            }
            return { batchSize: 5, hash: "0xretry" };
          }),
        },
      });

      const actor = createActor(testMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(5),
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 1,
        contractAddress: "0xcontract",
      });

      // Wait for error
      await waitFor(actor, (state) => state.value === "error");
      expect(actor.getSnapshot().value).toBe("error");

      // Retry
      actor.send({ type: "RETRY" });

      // Wait for completion
      await waitFor(actor, (state) => state.value === "completed");
      expect(actor.getSnapshot().value).toBe("completed");
      expect(actor.getSnapshot().context.error).toBeNull();
      actor.stop();
    });

    it("handles multiple batches correctly", async () => {
      let batchNumber = 0;
      const testMachine = batchSubmissionMachine.provide({
        actors: {
          submitBatch: fromPromise(async ({ input }) => {
            batchNumber++;
            return { batchSize: input.batch.length, hash: `0xhash${batchNumber}` };
          }),
        },
      });

      const actor = createActor(testMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      // Send 25 entries (should be split into batches of 20 + 5)
      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(25),
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 1,
        contractAddress: "0xcontract",
      });

      // Wait for completion
      await waitFor(actor, (state) => state.value === "completed");

      expect(actor.getSnapshot().value).toBe("completed");
      expect(actor.getSnapshot().context.submitted).toBe(25);
      expect(batchNumber).toBe(2); // Should have processed 2 batches
      actor.stop();
    });

    it("RESET returns to waiting from any state", async () => {
      const testMachine = batchSubmissionMachine.provide({
        actors: {
          submitBatch: fromPromise(async () => {
            throw new Error("Failed");
          }),
        },
      });

      const actor = createActor(testMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(5),
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 1,
        contractAddress: "0xcontract",
      });

      await waitFor(actor, (state) => state.value === "error");

      // Reset from error state
      actor.send({ type: "RESET" });

      expect(actor.getSnapshot().value).toBe("waiting");
      expect(actor.getSnapshot().context.queue).toHaveLength(0);
      expect(actor.getSnapshot().context.error).toBeNull();
      actor.stop();
    });
  });

  describe("Context Updates", () => {
    it("assigns entries correctly on RECEIVE_ENTRIES", () => {
      const actor = createActor(batchSubmissionMachine, {
        input: { walletClient: mockWalletClient, publicClient: mockPublicClient, abi: mockAbi },
      });
      actor.start();

      const entries = createTestEntries(3, "0xabc123");
      actor.send({
        type: "RECEIVE_ENTRIES",
        entries,
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 1,
        contractAddress: "0xcontract456",
      });

      const { context } = actor.getSnapshot();
      expect(context.queue).toEqual(entries);
      expect(context.total).toBe(3);
      expect(context.expectedAddress).toBe("0xabc123");
      expect(context.expectedChainId).toBe(1);
      expect(context.contractAddress).toBe("0xcontract456");
      actor.stop();
    });

    it("updates clients on WALLET_CHANGED", () => {
      const actor = createActor(batchSubmissionMachine, {
        input: { walletClient: null, publicClient: null, abi: mockAbi },
      });
      actor.start();

      actor.send({
        type: "WALLET_CHANGED",
        address: "0xnewaddress",
        chainId: 42,
        walletClient: mockWalletClient,
        publicClient: mockPublicClient,
      });

      const { context } = actor.getSnapshot();
      expect(context.walletClient).toBe(mockWalletClient);
      expect(context.publicClient).toBe(mockPublicClient);
      actor.stop();
    });
  });

  describe("Helper Functions", () => {
    it("getBlockReason returns addressMismatch correctly", () => {
      const context = {
        walletAddress: "0xaaa",
        expectedAddress: "0xbbb",
        walletChainId: 1,
        expectedChainId: 1,
      } as any;

      expect(getBlockReason(context)).toBe("addressMismatch");
    });

    it("getBlockReason returns chainMismatch correctly", () => {
      const context = {
        walletAddress: "0xaaa",
        expectedAddress: "0xaaa",
        walletChainId: 1,
        expectedChainId: 42,
      } as any;

      expect(getBlockReason(context)).toBe("chainMismatch");
    });

    it("getBlockReason returns null when validated", () => {
      const context = {
        walletAddress: "0xaaa",
        expectedAddress: "0xAAA", // case insensitive
        walletChainId: 1,
        expectedChainId: 1,
      } as any;

      expect(getBlockReason(context)).toBeNull();
    });

    it("getProgress calculates correctly", () => {
      expect(getProgress({ total: 0, submitted: 0 } as any)).toBe(0);
      expect(getProgress({ total: 10, submitted: 0 } as any)).toBe(0);
      expect(getProgress({ total: 10, submitted: 5 } as any)).toBe(50);
      expect(getProgress({ total: 10, submitted: 10 } as any)).toBe(100);
    });
  });

  describe("Guards", () => {
    it("isValidated requires wallet and public client", () => {
      const actor = createActor(batchSubmissionMachine, {
        input: { walletClient: null, publicClient: null, abi: mockAbi },
      });
      actor.start();

      actor.send({
        type: "RECEIVE_ENTRIES",
        entries: createTestEntries(5),
        walletAddress: "0x1234567890123456789012345678901234567890",
        walletChainId: 1,
        contractAddress: "0xcontract",
      });

      // Should be blocked because clients are null
      expect(actor.getSnapshot().value).toBe("blocked");
      actor.stop();
    });
  });
});
