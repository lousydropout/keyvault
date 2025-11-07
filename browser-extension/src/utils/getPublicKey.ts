import { contract } from "@/config";
import { logger } from "@/utils/logger";
import { Hex } from "viem";

export const getPublicKey = async (pubkey: Hex): Promise<string> => {
  try {
    return contract.read.pubKey([pubkey]);
  } catch (error) {
    logger.error("[getPublicKey] Error reading pure function:", error);
    return "";
  }
};
