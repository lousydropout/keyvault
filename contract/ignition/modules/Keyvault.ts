import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const KeyvaultModule = buildModule("KeyvaultModule", (m) => {
  const keyvault = m.contract("Keyvault", [], {});

  return { keyvault };
});

export default KeyvaultModule;
