import { createChainContract } from "@/config";
import { logger } from "@/utils/logger";
import { Hex } from "viem";

export const getPublicKey = async (pubkey: Hex, chainId: number): Promise<string> => {
  try {
    const contract = createChainContract(chainId);
    return contract.read.pubKey([pubkey]);
  } catch (error) {
    logger.error("[getPublicKey] Error reading pure function:", error);
    return "";
  }
};
