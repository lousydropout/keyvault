import { base, astar, hardhat } from "viem/chains";
import { createChainClient, createChainContract, abi } from "@/config";
import { CHAIN_CONFIGS } from "@/constants/chains";

describe("Config - Dynamic Chain Client/Contract Creation", () => {
  describe("createChainClient", () => {
    it("should create a client for Astar", () => {
      const astarClient = createChainClient(astar.id);
      expect(astarClient).toBeDefined();
      expect(astarClient.chain?.id).toBe(astar.id);
    });

    it("should create a client for Base", () => {
      const baseClient = createChainClient(base.id);
      expect(baseClient).toBeDefined();
      expect(baseClient.chain?.id).toBe(base.id);
    });

    it("should create a client for Hardhat/Localhost", () => {
      const hardhatClient = createChainClient(hardhat.id);
      expect(hardhatClient).toBeDefined();
      expect(hardhatClient.chain?.id).toBe(hardhat.id);
    });

    it("should throw error for unsupported chain ID", () => {
      expect(() => createChainClient(99999)).toThrow("Unsupported chain: 99999");
    });

    it("should create independent client instances", () => {
      const client1 = createChainClient(astar.id);
      const client2 = createChainClient(astar.id);
      // Each call should create a new instance
      expect(client1).not.toBe(client2);
    });

    it("should create clients with correct transport config", () => {
      const astarClient = createChainClient(astar.id);
      expect(astarClient.transport).toBeDefined();
      expect(astarClient.transport.type).toBe("http");
    });
  });

  describe("createChainContract", () => {
    it("should create a contract for Astar", () => {
      const astarContract = createChainContract(astar.id);
      expect(astarContract).toBeDefined();
      expect(astarContract.address).toBe(CHAIN_CONFIGS[astar.id].address);
    });

    it("should create a contract for Base", () => {
      const baseContract = createChainContract(base.id);
      expect(baseContract).toBeDefined();
      expect(baseContract.address).toBe(CHAIN_CONFIGS[base.id].address);
    });

    it("should create a contract for Hardhat/Localhost", () => {
      const hardhatContract = createChainContract(hardhat.id);
      expect(hardhatContract).toBeDefined();
      expect(hardhatContract.address).toBe(CHAIN_CONFIGS[hardhat.id].address);
    });

    it("should throw error for unsupported chain ID", () => {
      expect(() => createChainContract(99999)).toThrow("Unsupported chain: 99999");
    });

    it("should create contract with read methods", () => {
      const testContract = createChainContract(astar.id);
      expect(testContract.read).toBeDefined();
      expect(typeof testContract.read.numEntries).toBe("function");
      expect(typeof testContract.read.getEntries).toBe("function");
    });

    it("should use correct address for each chain", () => {
      const astarContract = createChainContract(astar.id);
      const baseContract = createChainContract(base.id);

      expect(astarContract.address).toBe(CHAIN_CONFIGS[astar.id].address);
      expect(baseContract.address).toBe(CHAIN_CONFIGS[base.id].address);
    });
  });

  describe("ABI export", () => {
    it("should export abi", () => {
      expect(abi).toBeDefined();
      expect(Array.isArray(abi)).toBe(true);
    });

    it("should have storeEntry function in abi", () => {
      const storeEntry = abi.find(
        (item: any) => item.type === "function" && item.name === "storeEntry"
      );
      expect(storeEntry).toBeDefined();
    });

    it("should have storeEntries batch function in abi", () => {
      const storeEntries = abi.find(
        (item: any) => item.type === "function" && item.name === "storeEntries"
      );
      expect(storeEntries).toBeDefined();
    });

    it("should have numEntries function in abi", () => {
      const numEntries = abi.find(
        (item: any) => item.type === "function" && item.name === "numEntries"
      );
      expect(numEntries).toBeDefined();
    });

    it("should have getEntries function in abi", () => {
      const getEntries = abi.find(
        (item: any) => item.type === "function" && item.name === "getEntries"
      );
      expect(getEntries).toBeDefined();
    });
  });

  describe("Cross-chain functionality", () => {
    it("should create different contracts for different chains", () => {
      const astarContract = createChainContract(astar.id);
      const baseContract = createChainContract(base.id);
      const hardhatContract = createChainContract(hardhat.id);

      // All should be defined
      expect(astarContract).toBeDefined();
      expect(baseContract).toBeDefined();
      expect(hardhatContract).toBeDefined();

      // Addresses should be consistent with config
      expect(astarContract.address).toBe(CHAIN_CONFIGS[astar.id].address);
      expect(baseContract.address).toBe(CHAIN_CONFIGS[base.id].address);
      expect(hardhatContract.address).toBe(CHAIN_CONFIGS[hardhat.id].address);
    });

    it("should maintain separate client instances per chain", () => {
      const astarClient = createChainClient(astar.id);
      const baseClient = createChainClient(base.id);

      expect(astarClient.chain?.id).toBe(astar.id);
      expect(baseClient.chain?.id).toBe(base.id);
      expect(astarClient).not.toBe(baseClient);
    });
  });
});
