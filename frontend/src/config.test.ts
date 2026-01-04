import { describe, it, expect } from "vitest";
import { getContractAddress, getChainById, createClientForChain } from "./config";

describe("config helpers", () => {
  describe("getContractAddress", () => {
    it("returns address for Base chain", () => {
      const address = getContractAddress(8453);
      expect(address).toBe("0x4DecB055bC80Ad00098A2CDda4E2c76b546E9403");
    });

    it("returns address for Astar chain", () => {
      const address = getContractAddress(592);
      expect(address).toBe("0x3afe36158bBA43715b22ECfeFa530f0981FAC9C0");
    });

    it("returns address for localhost chain", () => {
      const address = getContractAddress(31337);
      // This uses localKeyvaultAddress which may vary
      expect(address).toBeDefined();
      expect(address.startsWith("0x")).toBe(true);
    });

    it("throws for invalid chain ID", () => {
      expect(() => getContractAddress(99999)).toThrow();
    });
  });

  describe("getChainById", () => {
    it("returns Base chain object", () => {
      const chain = getChainById(8453);
      expect(chain.id).toBe(8453);
      expect(chain.name).toBe("Base");
    });

    it("returns Astar chain object", () => {
      const chain = getChainById(592);
      expect(chain.id).toBe(592);
      expect(chain.name).toBe("Astar");
    });

    it("returns Hardhat chain object for localhost", () => {
      const chain = getChainById(31337);
      expect(chain.id).toBe(31337);
    });

    it("throws for invalid chain ID", () => {
      expect(() => getChainById(99999)).toThrow();
    });
  });

  describe("createClientForChain", () => {
    it("creates public client for Base", () => {
      const client = createClientForChain(8453);
      expect(client).toBeDefined();
      expect(client.chain?.id).toBe(8453);
    });

    it("creates public client for Astar", () => {
      const client = createClientForChain(592);
      expect(client).toBeDefined();
      expect(client.chain?.id).toBe(592);
    });

    it("creates public client for localhost", () => {
      const client = createClientForChain(31337);
      expect(client).toBeDefined();
      expect(client.chain?.id).toBe(31337);
    });

    it("throws for invalid chain ID", () => {
      expect(() => createClientForChain(99999)).toThrow();
    });
  });
});
