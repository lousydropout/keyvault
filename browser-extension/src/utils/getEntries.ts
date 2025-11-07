import { contract } from "@/config";
import { Encrypted, parseEncryptedText } from "@/utils/encryption";
import { getNumEntries } from "@/utils/getNumEntries";
import { logger } from "@/utils/logger";
import { Dispatch, SetStateAction } from "react";
import { Hex } from "viem";

/**
 * Retrieves a list of encrypted entries from the contract.
 *
 * @param pubkey - The public key in hexadecimal format.
 * @param startFrom - The starting index for fetching entries.
 * @param limit - The maximum number of entries to fetch.
 * @returns A promise that resolves to an array of encrypted entries.
 * @throws Will throw an error if the contract read operation fails.
 */
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

    return Promise.all(
      results.map(async (result) => {
        if (result) {
          return parseEncryptedText(result.toString());
        } else {
          return { iv: "", ciphertext: "" };
        }
      })
    );
  } catch (error) {
    logger.error("[getEntries] ", error);
    throw error;
  }
};

/**
 * Updates the encrypted entries by fetching new entries from the chain and updating the state.
 *
 * @param pubkey - The public key used to fetch the entries.
 * @param encrypteds - The current list of encrypted entries.
 * @param setNumEntries - A state setter function to update the number of entries.
 * @param setEncrypteds - A state setter function to update the list of encrypted entries.
 * @returns A promise that resolves when the update is complete.
 *
 * @throws Will throw an error if the number of on-chain entries does not match the expected count.
 */
export const updateEncrypteds = async (
  pubkey: Hex,
  encrypteds: Encrypted[],
  setNumEntries: Dispatch<SetStateAction<number>>,
  setEncrypteds: Dispatch<SetStateAction<Encrypted[]>>
): Promise<void> => {
  const numOnChain = (await getNumEntries(pubkey)) ?? 0;
  setNumEntries(numOnChain);
  const _encrypteds: Encrypted[] = [];
  const offset = encrypteds.length;

  if (numOnChain === offset) return;

  const batchLength = 10;
  const numIterations = Math.ceil((numOnChain - offset) / batchLength);

  for (let i = 0; i < numIterations; i++) {
    const newEntries = await getEntries(
      pubkey,
      i * batchLength + offset,
      batchLength
    );
    _encrypteds.push(...newEntries);
  }

  if (encrypteds.length + _encrypteds.length !== numOnChain) {
    logger.warn("[updateEncrypteds] Number of on-chain entries does not match");
    logger.debug("data: ", {
      encrypteds: encrypteds,
      newEncrypteds: _encrypteds,
      numOnChain,
      batchLength,
      numIterations,
      offset,
    });
    throw new Error(
      "[updateEncrypteds] Number of on-chain entries does not match"
    );
  }

  setEncrypteds((prev) => [...prev, ..._encrypteds]);

  return;
};
