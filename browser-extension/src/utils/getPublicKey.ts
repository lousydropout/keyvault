import { contract } from "@/config";
import { Hex } from "viem";

export const getPublicKey = async (pubkey: Hex): Promise<string> => {
  try {
    return contract.read.pubKey([pubkey]);
  } catch (error) {
    console.log("[getPublicKey] Error reading pure function:", error);
    return "";
  }
};
