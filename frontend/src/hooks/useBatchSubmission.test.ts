import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock the dependencies before importing the hook
const mockSend = vi.fn();
const mockToast = vi.fn();
const mockAdvance = vi.fn();

let mockState = {
  value: "waiting",
  context: {
    queue: [],
    total: 0,
    submitted: 0,
    currentBatchSize: 0,
    expectedAddress: null,
    expectedChainId: null,
    error: null,
    lastTxHash: null,
  },
  matches: (state: string) => mockState.value === state,
};

vi.mock("@xstate/react", () => ({
  useMachine: () => [mockState, mockSend],
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x1234567890123456789012345678901234567890" }),
  useChainId: () => 8453,
  useWalletClient: () => ({ data: { account: {}, chain: {} } }),
  usePublicClient: () => ({}),
}));

vi.mock("@/config", () => ({
  abi: [],
  getContractAddress: () => "0xcontract",
}));

vi.mock("./useMessage", () => ({
  useMessage: () => ({
    queue: [],
    total: 0,
    remaining: 0,
    advance: mockAdvance,
  }),
}));

vi.mock("./use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Import after mocks
import { useBatchSubmission } from "./useBatchSubmission";

describe("useBatchSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      value: "waiting",
      context: {
        queue: [],
        total: 0,
        submitted: 0,
        currentBatchSize: 0,
        expectedAddress: null,
        expectedChainId: null,
        error: null,
        lastTxHash: null,
      },
      matches: (state: string) => mockState.value === state,
    };
  });

  describe("state flags", () => {
    it("returns isWaiting true when in waiting state", () => {
      mockState.value = "waiting";

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.isWaiting).toBe(true);
      expect(result.current.isSubmitting).toBe(false);
    });

    it("returns isSubmitting true when in submitting state", () => {
      mockState.value = "submitting";
      mockState.matches = (s: string) => s === "submitting";

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.isSubmitting).toBe(true);
      expect(result.current.isWaiting).toBe(false);
    });

    it("returns isBlocked true when in blocked state", () => {
      mockState.value = "blocked";
      mockState.matches = (s: string) => s === "blocked";

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.isBlocked).toBe(true);
    });

    it("returns isError true when in error state", () => {
      mockState.value = "error";
      mockState.matches = (s: string) => s === "error";

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.isError).toBe(true);
    });

    it("returns isCompleted true when in completed state", () => {
      mockState.value = "completed";
      mockState.matches = (s: string) => s === "completed";

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.isCompleted).toBe(true);
    });
  });

  describe("context values", () => {
    it("exposes queue from context", () => {
      mockState.context.queue = [{ address: "0x1", chainId: 1 }] as any;

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.queue).toHaveLength(1);
    });

    it("exposes total from context", () => {
      mockState.context.total = 10;

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.total).toBe(10);
    });

    it("exposes submitted from context", () => {
      mockState.context.submitted = 5;

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.submitted).toBe(5);
    });

    it("exposes error from context", () => {
      mockState.context.error = "Transaction failed";

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.error).toBe("Transaction failed");
    });
  });

  describe("derived values", () => {
    it("calculates progress correctly", () => {
      mockState.context.total = 10;
      mockState.context.submitted = 5;

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.progress).toBe(50);
    });

    it("returns 0 progress when total is 0", () => {
      mockState.context.total = 0;
      mockState.context.submitted = 0;

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.progress).toBe(0);
    });

    it("calculates remaining from queue length", () => {
      mockState.context.queue = [{}, {}, {}] as any;

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.remaining).toBe(3);
    });
  });

  describe("actions", () => {
    it("retry sends RETRY event", () => {
      const { result } = renderHook(() => useBatchSubmission());

      act(() => {
        result.current.retry();
      });

      expect(mockSend).toHaveBeenCalledWith({ type: "RETRY" });
    });

    it("reset sends RESET event", () => {
      const { result } = renderHook(() => useBatchSubmission());

      act(() => {
        result.current.reset();
      });

      expect(mockSend).toHaveBeenCalledWith({ type: "RESET" });
    });
  });

  describe("blockReason", () => {
    it("returns addressMismatch when addresses differ", () => {
      mockState.context.walletAddress = "0xaaa" as any;
      mockState.context.expectedAddress = "0xbbb" as any;
      mockState.context.walletChainId = 1 as any;
      mockState.context.expectedChainId = 1;

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.blockReason).toBe("addressMismatch");
    });

    it("returns chainMismatch when chains differ", () => {
      mockState.context.walletAddress = "0xaaa" as any;
      mockState.context.expectedAddress = "0xaaa" as any;
      mockState.context.walletChainId = 1 as any;
      mockState.context.expectedChainId = 42;

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.blockReason).toBe("chainMismatch");
    });

    it("returns null when validated", () => {
      mockState.context.walletAddress = "0xaaa" as any;
      mockState.context.expectedAddress = "0xAAA" as any;
      mockState.context.walletChainId = 1 as any;
      mockState.context.expectedChainId = 1;

      const { result } = renderHook(() => useBatchSubmission());

      expect(result.current.blockReason).toBeNull();
    });
  });
});
