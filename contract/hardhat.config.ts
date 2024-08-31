import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig, vars } from "hardhat/config";

const PRIVATE_KEY = vars.get("PRIVATE_KEY", "Need to set PRIVATE_KEY");

// This `LOCAL_PRIVATE_KEY` is for the Hardhat account #0 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
const LOCAL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

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
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337,
      accounts: [LOCAL_PRIVATE_KEY],
    },
  },
  defaultNetwork: "localhost",
};

export default config;
