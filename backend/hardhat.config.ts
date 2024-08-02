import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "london",
    },
  },
  networks: {
    shibuya: {
      url: "https://evm.shibuya.astar.network",
      chainId: 81,
      accounts: [PRIVATE_KEY],
    },
    astar: {
      url: "https://evm.astar.network",
      chainId: 592,
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;
