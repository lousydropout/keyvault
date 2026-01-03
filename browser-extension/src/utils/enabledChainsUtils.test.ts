import { describe, it, expect } from "bun:test";
import {
  enabledChainsHelpers,
  getChainWithMostEntries,
} from "@/utils/enabledChainsUtils";
import { ChainAccountInfo } from "@/utils/discoverAccounts";
import { astar, base, hardhat } from "viem/chains";

describe("enabledChainsHelpers", () => {
  describe("addChainToArray", () => {
    it("should add chain ID to empty array", () => {
      const result = enabledChainsHelpers.addChainToArray([], astar.id);
      expect(result).toEqual([astar.id]);
    });

    it("should add chain ID to existing array", () => {
      const result = enabledChainsHelpers.addChainToArray([astar.id], base.id);
      expect(result).toEqual([astar.id, base.id]);
    });

    it("should not duplicate chain ID if already present", () => {
      const result = enabledChainsHelpers.addChainToArray([astar.id], astar.id);
      expect(result).toEqual([astar.id]);
    });
  });

  describe("removeChainFromArray", () => {
    it("should remove chain ID from array", () => {
      const result = enabledChainsHelpers.removeChainFromArray(
        [astar.id, base.id],
        astar.id
      );
      expect(result).toEqual([base.id]);
    });

    it("should return empty array when removing last chain", () => {
      const result = enabledChainsHelpers.removeChainFromArray(
        [astar.id],
        astar.id
      );
      expect(result).toEqual([]);
    });

    it("should return unchanged array if chain ID not present", () => {
      const result = enabledChainsHelpers.removeChainFromArray(
        [astar.id],
        base.id
      );
      expect(result).toEqual([astar.id]);
    });
  });

  describe("isChainInArray", () => {
    it("should return true if chain ID is in array", () => {
      const result = enabledChainsHelpers.isChainInArray(
        [astar.id, base.id],
        astar.id
      );
      expect(result).toBe(true);
    });

    it("should return false if chain ID is not in array", () => {
      const result = enabledChainsHelpers.isChainInArray([astar.id], base.id);
      expect(result).toBe(false);
    });

    it("should return false for empty array", () => {
      const result = enabledChainsHelpers.isChainInArray([], astar.id);
      expect(result).toBe(false);
    });
  });
});

describe("getChainWithMostEntries", () => {
  it("should return null for empty array", () => {
    const result = getChainWithMostEntries([]);
    expect(result).toBeNull();
  });

  it("should return chain ID when single chain provided", () => {
    const accounts: ChainAccountInfo[] = [
      { chainId: astar.id, chainName: "Astar", numEntries: 5 },
    ];
    const result = getChainWithMostEntries(accounts);
    expect(result).toBe(astar.id);
  });

  it("should return chain ID with highest numEntries", () => {
    const accounts: ChainAccountInfo[] = [
      { chainId: astar.id, chainName: "Astar", numEntries: 5 },
      { chainId: base.id, chainName: "Base", numEntries: 10 },
      { chainId: hardhat.id, chainName: "Localhost", numEntries: 3 },
    ];
    const result = getChainWithMostEntries(accounts);
    expect(result).toBe(base.id);
  });

  it("should return first chain when multiple chains have same numEntries", () => {
    const accounts: ChainAccountInfo[] = [
      { chainId: astar.id, chainName: "Astar", numEntries: 5 },
      { chainId: base.id, chainName: "Base", numEntries: 5 },
    ];
    const result = getChainWithMostEntries(accounts);
    expect(result).toBe(astar.id);
  });

  it("should handle chains with zero entries", () => {
    const accounts: ChainAccountInfo[] = [
      { chainId: astar.id, chainName: "Astar", numEntries: 0 },
      { chainId: base.id, chainName: "Base", numEntries: 1 },
    ];
    const result = getChainWithMostEntries(accounts);
    expect(result).toBe(base.id);
  });
});
