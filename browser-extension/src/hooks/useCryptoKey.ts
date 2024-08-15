import { useChromeStorageLocal } from "@/hooks/useChromeLocalStorage";
import {
  exportCryptoKey,
  generateKey,
  importCryptoKey,
} from "@/utils/encryption";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function useCryptoKeyManager(): [
  JsonWebKey | null,
  Dispatch<SetStateAction<JsonWebKey | null>>,
  CryptoKey | null,
  () => Promise<void>
] {
  const [jwk, setJwk] = useChromeStorageLocal<JsonWebKey | null>("jwk", null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  const generateKeyHandler = async () => {
    const key = await generateKey(); // Generate the key
    const jwk = await exportCryptoKey(key); // Export the key to JWK for storage
    setJwk(jwk); // Store the JWK in Chrome's local storage
  };

  useEffect(() => {
    const setKey = async () => {
      if (jwk) {
        const key = await importCryptoKey(jwk); // Import the key from JWK to get a CryptoKey object
        setCryptoKey(key); // Set the CryptoKey object in state
      }
    };
    setKey();
  }, [jwk]); // Re-run this effect if the JWK changes

  // Return the CryptoKey object and the handler function to allow generating a new key
  return [jwk, setJwk, cryptoKey, generateKeyHandler];
}
