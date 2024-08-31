import { contract } from "@/config";
import { Encrypted, parseEncryptedText } from "@/utils/encryption";
import { Hex } from "viem";

export const getEntries = async (
  pubkey: Hex,
  startFrom: number,
  limit: number
): Promise<Encrypted[]> => {
  try {
    const results = (await contract.read.getEntries([
      pubkey,
      BigInt(startFrom),
      BigInt(limit),
    ])) as string[];

    const encryptedResults = await Promise.all(
      results.map(async (result) => {
        if (result) {
          return await parseEncryptedText(result.toString());
        } else {
          return { iv: "", ciphertext: "", onChain: true };
        }
      })
    );

    return encryptedResults;
  } catch (error) {
    console.log("[getEntries] ", error);
    throw error;
  }
};
