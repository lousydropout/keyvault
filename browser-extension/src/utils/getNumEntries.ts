import { shibuya } from "@/config";
import { keyvault, keyvaultShibuyaAddress } from "@/utils/contracts";
import { createPublicClient, http } from "viem";

export const getNumEntries = async (
  pubkey: string
): Promise<number | undefined> => {
  const client = createPublicClient({ chain: shibuya, transport: http() });

  try {
    const result = await client.readContract({
      address: keyvaultShibuyaAddress,
      abi: keyvault.abi,
      functionName: "numEntries",
      args: [pubkey],
    });

    return Number.parseInt(result?.toString() || "0");
  } catch (error) {
    console.error("Error reading pure function:", error);
  }
};
