import { CREDENTIALS, ENCRYPTEDS, MODIFIED, PENDING_CREDS } from "@/constants/hookVariables";
import { CHAIN_CONFIGS, DEFAULT_CHAIN_ID, SUPPORTED_CHAIN_IDS, isValidChainId, getChainConfig } from "@/constants/chains";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { createChainClient, createChainContract } from "@/config";
import { Cred } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { useMemo, useCallback } from "react";
import { hardhat, astar } from "viem/chains";

export const useChain = () => {
  const [storedChainId, setStoredChainId] = useBrowserStoreLocal<number>(
    "chainId",
    DEFAULT_CHAIN_ID
  );
  const [_creds, setCreds] = useBrowserStoreLocal<Cred[]>(CREDENTIALS, []);
  const [_encrypteds, setEncrypteds] = useBrowserStoreLocal<Encrypted[]>(
    ENCRYPTEDS,
    []
  );
  const [pendingCreds] = useBrowserStoreLocal<Cred[]>(PENDING_CREDS, []);
  const [modified, setModified] = useBrowserStoreLocal<boolean>(
    MODIFIED,
    false
  );

  // Validate stored chainId, fallback to default if invalid (handles migration)
  const chainId = isValidChainId(storedChainId) ? storedChainId : DEFAULT_CHAIN_ID;

  // Memoize client and contract to avoid recreation on every render
  const chainConfig = useMemo(() => getChainConfig(chainId), [chainId]);
  const client = useMemo(() => createChainClient(chainId), [chainId]);
  const contract = useMemo(() => createChainContract(chainId), [chainId]);

  // Check if there's unsaved data that would be lost
  const hasUnsavedData = pendingCreds.length > 0 || modified;

  const switchChain = useCallback((newChainId: number, force: boolean = false) => {
    if (!SUPPORTED_CHAIN_IDS.includes(newChainId)) {
      throw new Error(`Unsupported chain ID: ${newChainId}`);
    }
    if (newChainId === chainId) return { switched: false, reason: "same_chain" };

    // Warn if there's unsaved data (unless forced)
    if (hasUnsavedData && !force) {
      return { switched: false, reason: "unsaved_data" };
    }

    // Clear credentials first to avoid race condition where UI briefly
    // shows old credentials with new chain context
    setCreds([]);
    setEncrypteds([]);
    setStoredChainId(newChainId);
    setModified(true);

    return { switched: true, reason: null };
  }, [chainId, hasUnsavedData, setCreds, setEncrypteds, setStoredChainId, setModified]);

  return {
    chainId,
    chainConfig,
    client,
    contract,
    switchChain,
    supportedChains: SUPPORTED_CHAIN_IDS,
    modified,
    setModified,
    hasUnsavedData,
  };
};

// Keep legacy hook for backward compatibility
export const useChainId = () => {
  const { chainId, switchChain, modified, setModified } = useChain();

  // Legacy toggle between hardhat and astar only
  const toggleChain = () => {
    switchChain(chainId === hardhat.id ? astar.id : hardhat.id, true);
  };

  return { chainId, toggleChain, modified, setModified };
};
