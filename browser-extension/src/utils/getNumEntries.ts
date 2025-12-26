import { createChainContract } from "@/config";
import { logger } from "@/utils/logger";
import { Hex } from "viem";

export const getNumEntries = async (
  pubkey: Hex,
  chainId: number
): Promise<number | undefined> => {
  try {
    const contract = createChainContract(chainId);
    const result = await contract.read.numEntries([pubkey]);
    return Number.parseInt(result?.toString() || "0");
  } catch (error) {
    logger.error("Error reading numEntries:", error);
  }
};
