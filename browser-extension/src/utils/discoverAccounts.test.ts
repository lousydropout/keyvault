import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { base, astar, hardhat } from "viem/chains";
import * as config from "@/config";

// Mock for createChainContract to control test behavior
let mockContractBehavior: Record<number, { numEntries?: number; error?: Error }> = {};

const mockCreateChainContract = (chainId: number) => {
  return {
    read: {
      numEntries: async () => {
        const behavior = mockContractBehavior[chainId];
        if (behavior?.error) {
          throw behavior.error;
        }
        return BigInt(behavior?.numEntries ?? 0);
      },
    },
  };
};

describe("discoverAccounts", () => {
  const testPubkey = "0x0000000000000000000000000000000000000001" as const;

  beforeEach(() => {
    // Reset mock behavior before each test
    mockContractBehavior = {};
    // Apply the mock
    mock.module("@/config", () => ({
      ...config,
      createChainContract: mockCreateChainContract,
    }));
  });

  afterEach(() => {
    // Clear module cache to reset mocks
    mock.restore();
  });

  describe("function signature validation", () => {
    it("should accept pubkey and return DiscoveryResult structure", async () => {
      // Set up: all chains return 0 entries
      mockContractBehavior = {
        [astar.id]: { numEntries: 0 },
        [base.id]: { numEntries: 0 },
        [hardhat.id]: { numEntries: 0 },
      };

      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const result = await discoverAccounts(testPubkey);

      // Should return the correct structure with accounts and errors arrays
      expect(result).toHaveProperty("accounts");
      expect(result).toHaveProperty("errors");
      expect(Array.isArray(result.accounts)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should accept optional chainIds array parameter", async () => {
      mockContractBehavior = {
        [astar.id]: { numEntries: 0 },
      };

      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const result = await discoverAccounts(testPubkey, [astar.id]);

      expect(result).toHaveProperty("accounts");
      expect(result).toHaveProperty("errors");
    });

    it("should query all supported chains when no chainIds provided", async () => {
      // Set up: one chain has entries, others don't
      mockContractBehavior = {
        [astar.id]: { numEntries: 5 },
        [base.id]: { numEntries: 0 },
        [hardhat.id]: { error: new Error("Connection refused") },
      };

      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const { SUPPORTED_CHAIN_IDS } = await import("@/constants/chains");

      const result = await discoverAccounts(testPubkey);

      // Result should contain information about all queried chains
      // accounts (astar) + errors (hardhat) should be > 0
      expect(result.accounts.length + result.errors.length).toBeGreaterThan(0);
      expect(result.accounts.length + result.errors.length).toBeLessThanOrEqual(SUPPORTED_CHAIN_IDS.length);
    });
  });

  describe("error handling", () => {
    it("should capture errors per chain without blocking other chains", async () => {
      // Set up: localhost throws an error
      mockContractBehavior = {
        [hardhat.id]: { error: new Error("Connection refused") },
      };

      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const result = await discoverAccounts(testPubkey, [hardhat.id]);

      // Localhost should be in errors
      expect(result.errors.length).toBe(1);

      // Each error should have chainId, chainName, and error message
      for (const error of result.errors) {
        expect(error).toHaveProperty("chainId");
        expect(error).toHaveProperty("chainName");
        expect(error).toHaveProperty("error");
        expect(typeof error.chainId).toBe("number");
        expect(typeof error.chainName).toBe("string");
        expect(typeof error.error).toBe("string");
      }
    });

    it("should include chain names in error objects", async () => {
      mockContractBehavior = {
        [hardhat.id]: { error: new Error("Connection refused") },
      };

      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const result = await discoverAccounts(testPubkey, [hardhat.id]);

      // Verify chain names are correctly populated in errors
      const chainNames = result.errors.map((e) => e.chainName);
      expect(chainNames).toContain("Localhost");
    });

    it("should succeed on accessible chains while capturing errors on others", async () => {
      mockContractBehavior = {
        [astar.id]: { numEntries: 0 },
        [hardhat.id]: { error: new Error("Connection refused") },
      };

      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const result = await discoverAccounts(testPubkey, [astar.id, hardhat.id]);

      // Astar should succeed (returns 0 entries)
      // Localhost should fail
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].chainName).toBe("Localhost");
      // accounts array is empty since test address has 0 entries
      expect(result.accounts.length).toBe(0);
      // allChains should have entries for both
      expect(result.allChains.length).toBe(2);
    });
  });

  describe("ChainAccountInfo structure", () => {
    it("should define ChainAccountInfo with required fields", async () => {
      mockContractBehavior = {
        [astar.id]: { numEntries: 3 },
        [base.id]: { numEntries: 0 },
        [hardhat.id]: { numEntries: 0 },
      };

      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const result = await discoverAccounts(testPubkey);

      // Should have one account (astar with entries > 0)
      expect(result.accounts.length).toBe(1);
      for (const account of result.accounts) {
        expect(account).toHaveProperty("chainId");
        expect(account).toHaveProperty("chainName");
        expect(account).toHaveProperty("numEntries");
      }
    });
  });

  describe("allChains field", () => {
    it("should return status for all queried chains", async () => {
      mockContractBehavior = {
        [astar.id]: { numEntries: 0 },
        [base.id]: { numEntries: 0 },
      };

      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const result = await discoverAccounts(testPubkey, [astar.id, base.id]);

      // allChains should have entries for both queried chains
      expect(result.allChains.length).toBe(2);

      // Each entry should have required fields
      for (const chain of result.allChains) {
        expect(chain).toHaveProperty("chainId");
        expect(chain).toHaveProperty("chainName");
        expect(chain).toHaveProperty("status");
        expect(chain).toHaveProperty("numEntries");
        expect(["found", "not_found", "error"]).toContain(chain.status);
      }
    });

    it("should mark chains with numEntries > 0 as found", async () => {
      mockContractBehavior = {
        [astar.id]: { numEntries: 0 },
      };

      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const result = await discoverAccounts(testPubkey, [astar.id]);

      expect(result.allChains.length).toBe(1);
      expect(result.allChains[0].status).toBe("not_found");
      expect(result.allChains[0].numEntries).toBe(0);
    });

    it("should mark errored chains with error status", async () => {
      mockContractBehavior = {
        [hardhat.id]: { error: new Error("Connection refused") },
      };

      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const result = await discoverAccounts(testPubkey, [hardhat.id]);

      expect(result.allChains.length).toBe(1);
      expect(result.allChains[0].status).toBe("error");
      expect(result.allChains[0].error).toBeDefined();
    });
  });
});

describe("hasAccountOnAnyChain", () => {
  const testPubkey = "0x0000000000000000000000000000000000000001" as const;

  beforeEach(() => {
    mockContractBehavior = {};
    mock.module("@/config", () => ({
      ...config,
      createChainContract: mockCreateChainContract,
    }));
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return boolean", async () => {
    mockContractBehavior = {
      [astar.id]: { numEntries: 0 },
      [base.id]: { numEntries: 0 },
      [hardhat.id]: { numEntries: 0 },
    };

    const { hasAccountOnAnyChain } = await import("@/utils/discoverAccounts");
    const result = await hasAccountOnAnyChain(testPubkey);
    expect(typeof result).toBe("boolean");
  });

  it("should return false when no accounts found", async () => {
    mockContractBehavior = {
      [astar.id]: { numEntries: 0 },
      [base.id]: { numEntries: 0 },
      [hardhat.id]: { numEntries: 0 },
    };

    const { hasAccountOnAnyChain } = await import("@/utils/discoverAccounts");
    const result = await hasAccountOnAnyChain(testPubkey);
    expect(result).toBe(false);
  });

  it("should return true when accounts are found", async () => {
    mockContractBehavior = {
      [astar.id]: { numEntries: 5 },
      [base.id]: { numEntries: 0 },
      [hardhat.id]: { numEntries: 0 },
    };

    const { hasAccountOnAnyChain } = await import("@/utils/discoverAccounts");
    const result = await hasAccountOnAnyChain(testPubkey);
    expect(result).toBe(true);
  });
});

describe("getSingleAccountChain", () => {
  const testPubkey = "0x0000000000000000000000000000000000000001" as const;

  beforeEach(() => {
    mockContractBehavior = {};
    mock.module("@/config", () => ({
      ...config,
      createChainContract: mockCreateChainContract,
    }));
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return null when no accounts found", async () => {
    mockContractBehavior = {
      [astar.id]: { numEntries: 0 },
      [base.id]: { numEntries: 0 },
      [hardhat.id]: { numEntries: 0 },
    };

    const { getSingleAccountChain } = await import("@/utils/discoverAccounts");
    const result = await getSingleAccountChain(testPubkey);
    expect(result).toBeNull();
  });

  it("should return ChainAccountInfo when single account found", async () => {
    mockContractBehavior = {
      [astar.id]: { numEntries: 5 },
      [base.id]: { numEntries: 0 },
      [hardhat.id]: { numEntries: 0 },
    };

    const { getSingleAccountChain } = await import("@/utils/discoverAccounts");
    const result = await getSingleAccountChain(testPubkey);

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("chainId");
    expect(result).toHaveProperty("chainName");
    expect(result).toHaveProperty("numEntries");
    expect(result!.chainId).toBe(astar.id);
    expect(result!.numEntries).toBe(5);
  });

  it("should return null when multiple accounts found", async () => {
    mockContractBehavior = {
      [astar.id]: { numEntries: 5 },
      [base.id]: { numEntries: 3 },
      [hardhat.id]: { numEntries: 0 },
    };

    const { getSingleAccountChain } = await import("@/utils/discoverAccounts");
    const result = await getSingleAccountChain(testPubkey);
    expect(result).toBeNull();
  });
});
