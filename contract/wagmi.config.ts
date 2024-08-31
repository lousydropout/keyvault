import { defineConfig } from "@wagmi/cli";
import { hardhat } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "keyvault.abi.ts",
  contracts: [],
  plugins: [hardhat({ project: "." })],
});
