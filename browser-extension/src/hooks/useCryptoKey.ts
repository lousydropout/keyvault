import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useChromeStorageLocal } from "./useChromeLocalStorage";
import {
  exportCryptoKey,
  generateKey,
  importCryptoKey,
  hash,
} from "../utils/encryption";

export function useCryptoKeyManager(): [
  JsonWebKey | null,
  Dispatch<SetStateAction<JsonWebKey | null>>,
  string,
  CryptoKey | null,
  () => Promise<void>
] {
  const [jwk, setJwk, hasLoadedJwk] = useChromeStorageLocal<JsonWebKey | null>(
    "cryptoKey",
    null
  );
  const [jwkHash, setJwkHash] = useState<string>("");
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  const calcAndSetJwkHash = async (jwk: JsonWebKey) => {
    const _jwkHash = await hash(
      JSON.stringify(jwk, Object.keys(jwk as JsonWebKey).sort())
    );
    setJwkHash(_jwkHash);
  };

  const generateKeyHandler = async () => {
    const key = await generateKey(); // Generate the key
    const jwk = await exportCryptoKey(key); // Export the key to JWK for storage
    setJwk(jwk); // Store the JWK in Chrome's local storage
    await calcAndSetJwkHash(jwk);
  };

  useEffect(() => {
    const setKey = async () => {
      if (jwk) {
        const key = await importCryptoKey(jwk); // Import the key from JWK to get a CryptoKey object
        setCryptoKey(key); // Set the CryptoKey object in state
        await calcAndSetJwkHash(jwk);
      }
    };
    setKey();
  }, [jwk]); // Re-run this effect if the JWK changes

  useEffect(() => {
    if (!hasLoadedJwk) return;

    // generate key if none exists
    if (jwk === null) generateKeyHandler();
  }, [jwk, hasLoadedJwk]);

  // Return the CryptoKey object and the handler function to allow generating a new key
  return [jwk, setJwk, jwkHash, cryptoKey, generateKeyHandler];
}
