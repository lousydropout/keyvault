import { base, astar, hardhat } from "wagmi/chains";
import {
  CHAIN_CONFIGS,
  ChainConfig,
  SUPPORTED_CHAIN_IDS,
  DEFAULT_CHAIN_ID,
  getChainConfig,
  isValidChainId,
} from "@/chainConfig";

describe("Frontend Chain Config", () => {
  describe("CHAIN_CONFIGS", () => {
    it("should have configuration for Astar", () => {
      const config = CHAIN_CONFIGS[astar.id];
      expect(config).toBeDefined();
      expect(config.chain).toEqual(astar);
      expect(config.name).toBe("Astar");
      expect(config.apiUrl).toBe("https://evm.astar.network");
      expect(config.address).toBe("0x3afe36158bBA43715b22ECfeFa530f0981FAC9C0");
    });

    it("should have configuration for Base", () => {
      const config = CHAIN_CONFIGS[base.id];
      expect(config).toBeDefined();
      expect(config.chain).toEqual(base);
      expect(config.name).toBe("Base");
      expect(config.apiUrl).toBe("https://mainnet.base.org");
    });

    it("should have configuration for Localhost/Hardhat", () => {
      const config = CHAIN_CONFIGS[hardhat.id];
      expect(config).toBeDefined();
      expect(config.chain).toEqual(hardhat);
      expect(config.name).toBe("Localhost");
      expect(config.apiUrl).toBe("http://localhost:8545");
    });

    it("should have exactly 3 chain configurations", () => {
      expect(Object.keys(CHAIN_CONFIGS).length).toBe(3);
    });

    it("should have valid ChainConfig structure for each chain", () => {
      Object.entries(CHAIN_CONFIGS).forEach(([chainIdStr, config]) => {
        const chainId = Number(chainIdStr);
        expect(config.chain).toBeDefined();
        expect(config.chain.id).toBe(chainId);
        expect(typeof config.address).toBe("string");
        expect(typeof config.apiUrl).toBe("string");
        expect(typeof config.name).toBe("string");
      });
    });
  });

  describe("SUPPORTED_CHAIN_IDS", () => {
    it("should contain Astar chain ID", () => {
      expect(SUPPORTED_CHAIN_IDS).toContain(astar.id);
    });

    it("should contain Base chain ID", () => {
      expect(SUPPORTED_CHAIN_IDS).toContain(base.id);
    });

    it("should contain Hardhat chain ID", () => {
      expect(SUPPORTED_CHAIN_IDS).toContain(hardhat.id);
    });

    it("should have exactly 3 supported chain IDs", () => {
      expect(SUPPORTED_CHAIN_IDS.length).toBe(3);
    });
  });

  describe("DEFAULT_CHAIN_ID", () => {
    it("should be Astar chain ID", () => {
      expect(DEFAULT_CHAIN_ID).toBe(astar.id);
    });

    it("should be a supported chain ID", () => {
      expect(SUPPORTED_CHAIN_IDS).toContain(DEFAULT_CHAIN_ID);
    });
  });

  describe("getChainConfig", () => {
    it("should return Astar config for Astar chain ID", () => {
      const config = getChainConfig(astar.id);
      expect(config.name).toBe("Astar");
      expect(config.chain.id).toBe(astar.id);
    });

    it("should return Base config for Base chain ID", () => {
      const config = getChainConfig(base.id);
      expect(config.name).toBe("Base");
      expect(config.chain.id).toBe(base.id);
    });

    it("should return Localhost config for Hardhat chain ID", () => {
      const config = getChainConfig(hardhat.id);
      expect(config.name).toBe("Localhost");
      expect(config.chain.id).toBe(hardhat.id);
    });

    it("should throw error for unsupported chain ID", () => {
      const unsupportedChainId = 99999;
      expect(() => getChainConfig(unsupportedChainId)).toThrow(
        `Unsupported chain: ${unsupportedChainId}`
      );
    });

    it("should throw error for negative chain ID", () => {
      expect(() => getChainConfig(-1)).toThrow("Unsupported chain: -1");
    });

    it("should throw error for zero chain ID", () => {
      expect(() => getChainConfig(0)).toThrow("Unsupported chain: 0");
    });
  });

  describe("isValidChainId", () => {
    it("should return true for Astar chain ID", () => {
      expect(isValidChainId(astar.id)).toBe(true);
    });

    it("should return true for Base chain ID", () => {
      expect(isValidChainId(base.id)).toBe(true);
    });

    it("should return true for Hardhat chain ID", () => {
      expect(isValidChainId(hardhat.id)).toBe(true);
    });

    it("should return false for unsupported chain ID", () => {
      expect(isValidChainId(99999)).toBe(false);
    });

    it("should return false for zero", () => {
      expect(isValidChainId(0)).toBe(false);
    });

    it("should return false for negative numbers", () => {
      expect(isValidChainId(-1)).toBe(false);
    });

    it("should return false for Ethereum mainnet (unsupported)", () => {
      expect(isValidChainId(1)).toBe(false);
    });
  });

  describe("Chain ID values", () => {
    it("should have Astar chain ID of 592", () => {
      expect(astar.id).toBe(592);
    });

    it("should have Base chain ID of 8453", () => {
      expect(base.id).toBe(8453);
    });

    it("should have Hardhat chain ID of 31337", () => {
      expect(hardhat.id).toBe(31337);
    });
  });
});
