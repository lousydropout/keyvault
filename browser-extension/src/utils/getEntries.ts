import { contract } from "@/config";
import { merge } from "@/utils/credentials";
import { Encrypted, parseEncryptedText } from "@/utils/encryption";
import { getNumEntries } from "@/utils/getNumEntries";
import { Dispatch, SetStateAction } from "react";
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

    return Promise.all(
      results.map(async (result) => {
        if (result) {
          return parseEncryptedText(result.toString());
        } else {
          return { iv: "", ciphertext: "", onChain: true };
        }
      })
    );
  } catch (error) {
    console.log("[getEntries] ", error);
    throw error;
  }
};

export const updateEncrypteds = async (
  cryptoKey: CryptoKey,
  pubkey: Hex,
  encrypteds: Encrypted[],
  setEncrypteds: Dispatch<SetStateAction<Encrypted[]>>
): Promise<void> => {
  const numOnChain = (await getNumEntries(pubkey)) ?? 0;
  const onChainEntries = encrypteds.filter((e) => e.onChain);
  const offset = onChainEntries.length;

  if (numOnChain === offset) return;

  const batchLength = 100;
  const numIterations = Math.ceil((numOnChain - offset) / batchLength);

  for (let i = 0; i < numIterations; i++) {
    const newEntries = await getEntries(
      pubkey,
      i * batchLength + offset,
      batchLength
    );
    onChainEntries.push(...newEntries);
  }

  if (onChainEntries.length !== numOnChain) {
    console.log("[updateEncrypteds] Number of on-chain entries does not match");
    console.log("data: ", {
      currEncrtypeds: encrypteds,
      onChainEntries: onChainEntries,
      numOnChain,
      batchLength,
      numIterations,
      offset,
    });
    throw new Error(
      "[updateEncrypteds] Number of on-chain entries does not match"
    );
  }

  const merged = await merge(cryptoKey, onChainEntries, encrypteds);
  console.log("[updateEncrypteds] merged: ", merged);
  setEncrypteds(merged);

  return;
};
