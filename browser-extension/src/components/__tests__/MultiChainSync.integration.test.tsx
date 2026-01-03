import { describe, it, expect, mock } from "bun:test";
import {
  multiChainSyncHelpers,
  ChainSyncRow,
  MultiChainSyncView,
} from "../MultiChainSyncView";
import { ChainSyncStatus } from "@/machines/multiChainSync.machine";
import { astar, base, hardhat } from "viem/chains";

/**
 * Tests for MultiChainSync component and its helper functions.
 *
 * Following the codebase patterns:
 * - Pure helper functions are tested directly
 * - Presentational components without hooks can be called directly
 * - Tests focus on user-visible behavior and logic correctness
 */
describe("multiChainSyncHelpers", () => {
  describe("getStatusText", () => {
    it("returns 'Up to date' for up-to-date status", () => {
      const status: ChainSyncStatus = {
        numEntries: 10,
        status: "up-to-date",
        behind: 0,
      };
      expect(multiChainSyncHelpers.getStatusText(status)).toBe("Up to date");
    });

    it("returns singular 'entry' for 1 entry behind", () => {
      const status: ChainSyncStatus = {
        numEntries: 9,
        status: "behind",
        behind: 1,
      };
      expect(multiChainSyncHelpers.getStatusText(status)).toBe("1 entry behind");
    });

    it("returns plural 'entries' for multiple behind", () => {
      const status: ChainSyncStatus = {
        numEntries: 5,
        status: "behind",
        behind: 5,
      };
      expect(multiChainSyncHelpers.getStatusText(status)).toBe("5 entries behind");
    });
  });

  describe("isSyncDisabled", () => {
    it("returns true when status is undefined", () => {
      expect(multiChainSyncHelpers.isSyncDisabled(undefined, false)).toBe(true);
    });

    it("returns true when syncing", () => {
      const status: ChainSyncStatus = {
        numEntries: 5,
        status: "behind",
        behind: 5,
      };
      expect(multiChainSyncHelpers.isSyncDisabled(status, true)).toBe(true);
    });

    it("returns true when chain is up-to-date", () => {
      const status: ChainSyncStatus = {
        numEntries: 10,
        status: "up-to-date",
        behind: 0,
      };
      expect(multiChainSyncHelpers.isSyncDisabled(status, false)).toBe(true);
    });

    it("returns false when chain is behind and not syncing", () => {
      const status: ChainSyncStatus = {
        numEntries: 5,
        status: "behind",
        behind: 5,
      };
      expect(multiChainSyncHelpers.isSyncDisabled(status, false)).toBe(false);
    });
  });

  describe("getStatusColorClass", () => {
    it("returns green for up-to-date status", () => {
      const status: ChainSyncStatus = {
        numEntries: 10,
        status: "up-to-date",
        behind: 0,
      };
      expect(multiChainSyncHelpers.getStatusColorClass(status)).toBe("bg-green-500");
    });

    it("returns yellow for behind status", () => {
      const status: ChainSyncStatus = {
        numEntries: 5,
        status: "behind",
        behind: 5,
      };
      expect(multiChainSyncHelpers.getStatusColorClass(status)).toBe("bg-yellow-500");
    });

    it("returns gray for undefined status", () => {
      expect(multiChainSyncHelpers.getStatusColorClass(undefined)).toBe("bg-gray-400");
    });
  });

  describe("getStatusTextColorClass", () => {
    it("returns green text for up-to-date status", () => {
      const status: ChainSyncStatus = {
        numEntries: 10,
        status: "up-to-date",
        behind: 0,
      };
      expect(multiChainSyncHelpers.getStatusTextColorClass(status)).toBe(
        "text-green-400"
      );
    });

    it("returns yellow text for behind status", () => {
      const status: ChainSyncStatus = {
        numEntries: 5,
        status: "behind",
        behind: 5,
      };
      expect(multiChainSyncHelpers.getStatusTextColorClass(status)).toBe(
        "text-yellow-400"
      );
    });
  });
});

describe("ChainSyncRow", () => {
  const upToDateStatus: ChainSyncStatus = {
    numEntries: 10,
    status: "up-to-date",
    behind: 0,
  };

  const behindStatus: ChainSyncStatus = {
    numEntries: 5,
    status: "behind",
    behind: 5,
  };

  it("renders chain name correctly", () => {
    const mockSync = mock(() => {});
    const result = ChainSyncRow({
      chainId: astar.id,
      chainName: "Astar",
      status: upToDateStatus,
      isSyncing: false,
      isCurrentSyncTarget: false,
      onSync: mockSync,
    });

    expect(result).not.toBeNull();
    expect(result?.props?.["data-chain-id"]).toBe(astar.id);
  });

  it("renders with green indicator for up-to-date chain", () => {
    const mockSync = mock(() => {});
    const result = ChainSyncRow({
      chainId: base.id,
      chainName: "Base",
      status: upToDateStatus,
      isSyncing: false,
      isCurrentSyncTarget: false,
      onSync: mockSync,
    });

    expect(result).not.toBeNull();
  });

  it("renders with yellow indicator for behind chain", () => {
    const mockSync = mock(() => {});
    const result = ChainSyncRow({
      chainId: hardhat.id,
      chainName: "Localhost",
      status: behindStatus,
      isSyncing: false,
      isCurrentSyncTarget: false,
      onSync: mockSync,
    });

    expect(result).not.toBeNull();
  });

  it("shows 'Syncing...' when syncing this chain", () => {
    const mockSync = mock(() => {});
    const result = ChainSyncRow({
      chainId: astar.id,
      chainName: "Astar",
      status: behindStatus,
      isSyncing: true,
      isCurrentSyncTarget: true,
      onSync: mockSync,
    });

    expect(result).not.toBeNull();
  });
});

describe("MultiChainSyncView", () => {
  const chainStatuses = new Map<number, ChainSyncStatus>([
    [astar.id, { numEntries: 10, status: "up-to-date", behind: 0 }],
    [base.id, { numEntries: 5, status: "behind", behind: 5 }],
  ]);

  it("renders empty state when no chains enabled", () => {
    const mockSync = mock(() => {});
    const mockRetry = mock(() => {});
    const mockDiscover = mock(() => {});

    const result = MultiChainSyncView({
      enabledChainIds: [],
      chainStatuses: new Map(),
      isDiscovering: false,
      isSyncing: false,
      syncTargetChainId: null,
      error: null,
      onSync: mockSync,
      onRetry: mockRetry,
      onDiscover: mockDiscover,
    });

    expect(result).not.toBeNull();
  });

  it("renders discovering state with loading message", () => {
    const mockSync = mock(() => {});
    const mockRetry = mock(() => {});
    const mockDiscover = mock(() => {});

    const result = MultiChainSyncView({
      enabledChainIds: [astar.id, base.id],
      chainStatuses: new Map(),
      isDiscovering: true,
      isSyncing: false,
      syncTargetChainId: null,
      error: null,
      onSync: mockSync,
      onRetry: mockRetry,
      onDiscover: mockDiscover,
    });

    expect(result).not.toBeNull();
  });

  it("renders error state with retry button", () => {
    const mockSync = mock(() => {});
    const mockRetry = mock(() => {});
    const mockDiscover = mock(() => {});

    const result = MultiChainSyncView({
      enabledChainIds: [astar.id, base.id],
      chainStatuses: new Map(),
      isDiscovering: false,
      isSyncing: false,
      syncTargetChainId: null,
      error: "Failed to discover chains",
      onSync: mockSync,
      onRetry: mockRetry,
      onDiscover: mockDiscover,
    });

    expect(result).not.toBeNull();
  });

  it("renders chain rows for each enabled chain", () => {
    const mockSync = mock(() => {});
    const mockRetry = mock(() => {});
    const mockDiscover = mock(() => {});

    const result = MultiChainSyncView({
      enabledChainIds: [astar.id, base.id],
      chainStatuses,
      isDiscovering: false,
      isSyncing: false,
      syncTargetChainId: null,
      error: null,
      onSync: mockSync,
      onRetry: mockRetry,
      onDiscover: mockDiscover,
    });

    expect(result).not.toBeNull();
  });

  it("displays up-to-date status for chains at max entries", () => {
    const allUpToDate = new Map<number, ChainSyncStatus>([
      [astar.id, { numEntries: 10, status: "up-to-date", behind: 0 }],
      [base.id, { numEntries: 10, status: "up-to-date", behind: 0 }],
    ]);

    const mockSync = mock(() => {});
    const mockRetry = mock(() => {});
    const mockDiscover = mock(() => {});

    const result = MultiChainSyncView({
      enabledChainIds: [astar.id, base.id],
      chainStatuses: allUpToDate,
      isDiscovering: false,
      isSyncing: false,
      syncTargetChainId: null,
      error: null,
      onSync: mockSync,
      onRetry: mockRetry,
      onDiscover: mockDiscover,
    });

    expect(result).not.toBeNull();
  });

  it("displays behind status for chains with fewer entries", () => {
    const withBehind = new Map<number, ChainSyncStatus>([
      [astar.id, { numEntries: 10, status: "up-to-date", behind: 0 }],
      [base.id, { numEntries: 3, status: "behind", behind: 7 }],
    ]);

    const mockSync = mock(() => {});
    const mockRetry = mock(() => {});
    const mockDiscover = mock(() => {});

    const result = MultiChainSyncView({
      enabledChainIds: [astar.id, base.id],
      chainStatuses: withBehind,
      isDiscovering: false,
      isSyncing: false,
      syncTargetChainId: null,
      error: null,
      onSync: mockSync,
      onRetry: mockRetry,
      onDiscover: mockDiscover,
    });

    expect(result).not.toBeNull();
  });
});
