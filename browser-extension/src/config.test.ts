import { base, astar, hardhat } from "viem/chains";
import {
  createChainClient,
  createChainContract,
  NETWORK,
  abi,
  chain,
  address,
  apiUrl,
  dappUrl,
  client,
  contract,
} from "@/config";
import { CHAIN_CONFIGS } from "@/constants/chains";
import { ASTAR, BASE, LOCALHOST } from "@/constants/networks";

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
      expect(typeof testContract.read.entries).toBe("function");
    });

    it("should use correct address for each chain", () => {
      const astarContract = createChainContract(astar.id);
      const baseContract = createChainContract(base.id);

      expect(astarContract.address).toBe("0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B");
      expect(baseContract.address).toBe(CHAIN_CONFIGS[base.id].address);
    });
  });

  describe("NETWORK constant", () => {
    it("should be one of the allowed network values", () => {
      const allowedNetworks = [LOCALHOST, ASTAR, BASE];
      expect(allowedNetworks).toContain(NETWORK);
    });

    it("should be a string", () => {
      expect(typeof NETWORK).toBe("string");
    });
  });

  describe("Legacy exports", () => {
    it("should export chain object", () => {
      expect(chain).toBeDefined();
      expect(chain.id).toBeDefined();
    });

    it("should export address as hex string", () => {
      expect(address).toBeDefined();
      expect(typeof address).toBe("string");
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should export apiUrl as string", () => {
      expect(apiUrl).toBeDefined();
      expect(typeof apiUrl).toBe("string");
      expect(apiUrl).toMatch(/^https?:\/\//);
    });

    it("should export dappUrl as string", () => {
      expect(dappUrl).toBeDefined();
      expect(typeof dappUrl).toBe("string");
      expect(dappUrl).toMatch(/^https?:\/\//);
    });

    it("should export client with correct chain", () => {
      expect(client).toBeDefined();
      expect(client.chain).toBe(chain);
    });

    it("should export contract with correct address", () => {
      expect(contract).toBeDefined();
      expect(contract.address).toBe(address);
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
