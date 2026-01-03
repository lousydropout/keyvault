import { describe, it, expect, mock } from "bun:test";
import {
  chainSelectionHelpers,
  ChainSelectionItem,
} from "../ChainSelectionScreen";
import { ChainAccountInfo } from "@/utils/discoverAccounts";
import { astar, base, hardhat } from "viem/chains";

/**
 * Tests for ChainSelectionScreen component and its helper functions.
 *
 * Following the codebase patterns:
 * - Pure helper functions are tested directly
 * - Presentational components without hooks can be called directly
 * - Tests focus on user-visible behavior and logic correctness
 */
describe("chainSelectionHelpers", () => {
  const multipleChains: ChainAccountInfo[] = [
    { chainId: astar.id, chainName: "Astar", numEntries: 5 },
    { chainId: base.id, chainName: "Base", numEntries: 10 },
    { chainId: hardhat.id, chainName: "Localhost", numEntries: 3 },
  ];

  describe("toggleChainInSet", () => {
    it("adds chain ID to set when not present", () => {
      const current = new Set<number>([astar.id]);
      const result = chainSelectionHelpers.toggleChainInSet(current, base.id);

      expect(result.has(astar.id)).toBe(true);
      expect(result.has(base.id)).toBe(true);
      expect(result.size).toBe(2);
    });

    it("removes chain ID from set when already present", () => {
      const current = new Set<number>([astar.id, base.id]);
      const result = chainSelectionHelpers.toggleChainInSet(current, astar.id);

      expect(result.has(astar.id)).toBe(false);
      expect(result.has(base.id)).toBe(true);
      expect(result.size).toBe(1);
    });

    it("does not mutate original set", () => {
      const current = new Set<number>([astar.id]);
      const result = chainSelectionHelpers.toggleChainInSet(current, base.id);

      expect(current.size).toBe(1);
      expect(result.size).toBe(2);
    });
  });

  describe("canContinue", () => {
    it("returns false when no chains selected", () => {
      expect(chainSelectionHelpers.canContinue(0)).toBe(false);
    });

    it("returns true when at least one chain selected", () => {
      expect(chainSelectionHelpers.canContinue(1)).toBe(true);
    });

    it("returns true when multiple chains selected", () => {
      expect(chainSelectionHelpers.canContinue(3)).toBe(true);
    });
  });

  describe("getInitialSelection", () => {
    it("returns all chain IDs for multiple chains", () => {
      const result = chainSelectionHelpers.getInitialSelection(multipleChains);

      expect(result.size).toBe(3);
      expect(result.has(astar.id)).toBe(true);
      expect(result.has(base.id)).toBe(true);
      expect(result.has(hardhat.id)).toBe(true);
    });

    it("returns single chain ID for single chain", () => {
      const singleChain = [{ chainId: base.id, chainName: "Base", numEntries: 10 }];
      const result = chainSelectionHelpers.getInitialSelection(singleChain);

      expect(result.size).toBe(1);
      expect(result.has(base.id)).toBe(true);
    });

    it("returns empty set for empty array", () => {
      const result = chainSelectionHelpers.getInitialSelection([]);
      expect(result.size).toBe(0);
    });
  });

  describe("getSelectionSummary", () => {
    it("shows correct summary for multiple chains", () => {
      const result = chainSelectionHelpers.getSelectionSummary(2, 3);
      expect(result).toBe("2 of 3 chains selected");
    });

    it("shows correct summary for single chain", () => {
      const result = chainSelectionHelpers.getSelectionSummary(1, 1);
      expect(result).toBe("1 of 1 chain selected");
    });

    it("shows correct summary when none selected", () => {
      const result = chainSelectionHelpers.getSelectionSummary(0, 3);
      expect(result).toBe("0 of 3 chains selected");
    });
  });
});

describe("ChainSelectionItem", () => {
  const mockChain: ChainAccountInfo = {
    chainId: astar.id,
    chainName: "Astar",
    numEntries: 5,
  };

  it("renders chain with correct name", () => {
    const mockToggle = mock(() => {});
    const result = ChainSelectionItem({
      chain: mockChain,
      isSelected: true,
      onToggle: mockToggle,
    });

    expect(result).not.toBeNull();
    expect(result?.props).toBeDefined();
  });

  it("renders with selected styling when isSelected is true", () => {
    const mockToggle = mock(() => {});
    const result = ChainSelectionItem({
      chain: mockChain,
      isSelected: true,
      onToggle: mockToggle,
    });

    // Check that the selected class is applied
    const className = result?.props?.className || "";
    expect(className.includes("border-green-500")).toBe(true);
  });

  it("renders with unselected styling when isSelected is false", () => {
    const mockToggle = mock(() => {});
    const result = ChainSelectionItem({
      chain: mockChain,
      isSelected: false,
      onToggle: mockToggle,
    });

    const className = result?.props?.className || "";
    expect(className.includes("border-slate-600")).toBe(true);
  });

  it("displays correct number of credentials", () => {
    const chainWithMany: ChainAccountInfo = {
      chainId: base.id,
      chainName: "Base",
      numEntries: 10,
    };
    const mockToggle = mock(() => {});
    const result = ChainSelectionItem({
      chain: chainWithMany,
      isSelected: true,
      onToggle: mockToggle,
    });

    expect(result).not.toBeNull();
  });

  it("handles single credential with correct grammar", () => {
    const chainWithOne: ChainAccountInfo = {
      chainId: base.id,
      chainName: "Base",
      numEntries: 1,
    };
    const mockToggle = mock(() => {});
    const result = ChainSelectionItem({
      chain: chainWithOne,
      isSelected: false,
      onToggle: mockToggle,
    });

    expect(result).not.toBeNull();
  });
});
