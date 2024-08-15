import { shibuya } from "@/config";
import { keyvault, keyvaultShibuyaAddress } from "@/utils/contracts";
import { createPublicClient, http } from "viem";
import { Encrypted, parseEncryptedText } from "./encryption";

export const getEntries = async (
  pubkey: string,
  startFrom: number,
  limit: number
): Promise<Encrypted[]> => {
  const client = createPublicClient({ chain: shibuya, transport: http() });

  try {
    const results = (await client.readContract({
      address: keyvaultShibuyaAddress,
      abi: keyvault.abi,
      functionName: "getEntries",
      args: [pubkey, startFrom, limit],
    })) as string[];

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
