import { contract } from "@/config";
import { Hex } from "viem";

export const getNumEntries = async (
  pubkey: Hex
): Promise<number | undefined> => {
  try {
    const result = await contract.read.numEntries([pubkey]);

    return Number.parseInt(result?.toString() || "0");
  } catch (error) {
    console.error("Error reading pure function:", error);
  }
};
