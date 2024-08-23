import { shibuya } from "@/config";
import { keyvaultAbi as abi } from "@/keyvault.abi";
import { createPublicClient, getContract, Hex, http } from "viem";
import { astar } from "viem/chains";

const IS_PROD = false;

const keyvaultShibuyaAddress = "0xcEed8a0537BcEe48e8BfD0a7886403e4093E7845";
const keyvaultAstarAddress = "0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B";

let chain, address;
if (IS_PROD) {
  chain = astar;
  address = keyvaultAstarAddress as Hex;
} else {
  chain = shibuya;
  address = keyvaultShibuyaAddress as Hex;
}

const client = createPublicClient({ chain, transport: http() });
export const contract = getContract({ abi, address, client });
