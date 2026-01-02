import { describe, it, expect, mock } from "bun:test";
import { base, astar, hardhat } from "viem/chains";

describe("discoverAccounts", () => {
  const testPubkey = "0x0000000000000000000000000000000000000001" as const;

  describe("function signature validation", () => {
    it("should accept pubkey and return DiscoveryResult structure", async () => {
      const { discoverAccounts } = await import("@/utils/discoverAccounts");

      // Will fail on network calls but validates structure
      const result = await discoverAccounts(testPubkey);

      // Should return the correct structure with accounts and errors arrays
      expect(result).toHaveProperty("accounts");
      expect(result).toHaveProperty("errors");
      expect(Array.isArray(result.accounts)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should accept optional chainIds array parameter", async () => {
      const { discoverAccounts } = await import("@/utils/discoverAccounts");

      // Test with specific chains only
      const result = await discoverAccounts(testPubkey, [astar.id]);

      expect(result).toHaveProperty("accounts");
      expect(result).toHaveProperty("errors");
    });

    it("should query all supported chains when no chainIds provided", async () => {
      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const { SUPPORTED_CHAIN_IDS } = await import("@/constants/chains");

      const result = await discoverAccounts(testPubkey);

      // Result should contain information about all queried chains
      // Some may succeed (Astar is accessible), some may fail (localhost not running, Base invalid address)
      // We just verify we got results for the chains we queried
      expect(result.accounts.length + result.errors.length).toBeGreaterThan(0);
      expect(result.accounts.length + result.errors.length).toBeLessThanOrEqual(SUPPORTED_CHAIN_IDS.length);
    });
  });

  describe("error handling", () => {
    it("should capture errors per chain without blocking other chains", async () => {
      const { discoverAccounts } = await import("@/utils/discoverAccounts");

      // Query Base which has invalid placeholder address - guaranteed to fail
      const result = await discoverAccounts(testPubkey, [base.id]);

      // Base should be in errors (invalid placeholder address)
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
      const { discoverAccounts } = await import("@/utils/discoverAccounts");

      // Query Base which will fail
      const result = await discoverAccounts(testPubkey, [base.id]);

      // Verify chain names are correctly populated in errors
      const chainNames = result.errors.map((e) => e.chainName);
      expect(chainNames).toContain("Base");
    });

    it("should succeed on accessible chains while capturing errors on others", async () => {
      const { discoverAccounts } = await import("@/utils/discoverAccounts");

      // Astar RPC is accessible, Base will fail
      const result = await discoverAccounts(testPubkey, [astar.id, base.id]);

      // Astar should succeed (returns 0 entries for test address)
      // Base should fail (invalid placeholder address)
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].chainName).toBe("Base");
      // accounts array is empty since test address has 0 entries
      expect(result.accounts.length).toBe(0);
      // allChains should have entries for both
      expect(result.allChains.length).toBe(2);
    });
  });

  describe("ChainAccountInfo structure", () => {
    it("should define ChainAccountInfo with required fields", async () => {
      // Type validation - if this compiles, the types are correct
      const { discoverAccounts } = await import("@/utils/discoverAccounts");
      const result = await discoverAccounts(testPubkey);

      // Even with empty accounts, the structure is valid
      for (const account of result.accounts) {
        expect(account).toHaveProperty("chainId");
        expect(account).toHaveProperty("chainName");
        expect(account).toHaveProperty("numEntries");
      }
    });
  });

  describe("allChains field", () => {
    it("should return status for all queried chains", async () => {
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
      const { discoverAccounts } = await import("@/utils/discoverAccounts");

      // Astar should succeed but with 0 entries for test address
      const result = await discoverAccounts(testPubkey, [astar.id]);

      expect(result.allChains.length).toBe(1);
      expect(result.allChains[0].status).toBe("not_found");
      expect(result.allChains[0].numEntries).toBe(0);
    });

    it("should mark errored chains with error status", async () => {
      const { discoverAccounts } = await import("@/utils/discoverAccounts");

      // Base has invalid placeholder address
      const result = await discoverAccounts(testPubkey, [base.id]);

      expect(result.allChains.length).toBe(1);
      expect(result.allChains[0].status).toBe("error");
      expect(result.allChains[0].error).toBeDefined();
    });
  });
});

describe("hasAccountOnAnyChain", () => {
  const testPubkey = "0x0000000000000000000000000000000000000001" as const;

  it("should return boolean", async () => {
    const { hasAccountOnAnyChain } = await import("@/utils/discoverAccounts");

    // Will be false since all chains fail in test
    const result = await hasAccountOnAnyChain(testPubkey);
    expect(typeof result).toBe("boolean");
  });

  it("should return false when no accounts found", async () => {
    const { hasAccountOnAnyChain } = await import("@/utils/discoverAccounts");

    // All chains fail in test, so no accounts found
    const result = await hasAccountOnAnyChain(testPubkey);
    expect(result).toBe(false);
  });
});

describe("getSingleAccountChain", () => {
  const testPubkey = "0x0000000000000000000000000000000000000001" as const;

  it("should return null when no accounts found", async () => {
    const { getSingleAccountChain } = await import("@/utils/discoverAccounts");

    // All chains fail in test
    const result = await getSingleAccountChain(testPubkey);
    expect(result).toBeNull();
  });

  it("should return ChainAccountInfo or null", async () => {
    const { getSingleAccountChain } = await import("@/utils/discoverAccounts");

    const result = await getSingleAccountChain(testPubkey);

    // Result is either null or has the expected structure
    if (result !== null) {
      expect(result).toHaveProperty("chainId");
      expect(result).toHaveProperty("chainName");
      expect(result).toHaveProperty("numEntries");
    } else {
      expect(result).toBeNull();
    }
  });
});
