import { View } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useChain } from "@/side_panel/chain";
import { CHAIN_CONFIGS } from "@/constants/chains";
import {
  KEYPAIRS,
  PENDING_CREDS,
  PUBKEY,
  VIEW,
} from "@/constants/hookVariables";
import { useBrowserStore, useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { logger } from "@/utils/logger";
import { createKeypairCred, Cred, KeypairCred } from "@/utils/credentials";
import { getPublicKey } from "@/utils/getPublicKey";
import { genKey } from "@/utils/openpgp";
import { useEffect, useState } from "react";
import { Hex } from "viem";

const shorten = (s: string) => {
  return s.slice(0, 6) + "..." + s.slice(s.length - 6);
};

export const GenerateKeypair = () => {
  const { chainId } = useChain();
  const [_pendingCreds, setPendingCreds] = useBrowserStoreLocal<Cred[]>(
    PENDING_CREDS,
    []
  );
  const [keypairs, setKeypairs] = useBrowserStoreLocal<KeypairCred[]>(
    KEYPAIRS,
    []
  );
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");
  const [_view, setView] = useBrowserStore<View>(VIEW, "New Credential");
  const [publicKey, setPublicKey] = useState<string>("");
  const [matches, setMatches] = useState<boolean>(false);
  const [tabIds, setTabIds] = useState<number[]>([]);
  const [sent, setSent] = useState<boolean>(false);

  useEffect(() => {
    if (!pubkey) return;
    getPublicKey(pubkey as Hex, chainId).then((key) => {
      if (key) setPublicKey(key);
    });
  }, [pubkey, chainId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (sent) {
        getPublicKey(pubkey as Hex, chainId).then((key) => {
          if (key) setPublicKey(key);
        });
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [sent, chainId]);

  useEffect(() => {
    if (!keypairs || !publicKey) return;

    if (keypairs.map((u) => u.publicKey).includes(publicKey)) {
      setMatches(true);
    }
  }, [keypairs, publicKey]);

  const keypairExists = keypairs.length > 0;

  if (matches) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl mb-4">Generate Keypair</h1>
          <div className="relative w-full flex items-center justify-center">
            <div className="mt-2 flex flex-col items-center justify-center space-x-2 cursor-pointer">
              <p className="text-xl border-red-700 p-4 my-4 border rounded-md">
                Pubkey associated with your account: {shorten(publicKey)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sendData = () => {
    logger.debug("[sendData]: ", {
      pubkey,
      publicKeys: keypairs.map((u) => u.publicKey),
    });
    // message does not contain any unencrypted or sensitive data
    const data = {
      pubkey: keypairs[keypairs.length - 1].publicKey,
      address: pubkey,
      chainId,
    };

    for (const tabId of tabIds) {
      logger.debug(`Forwarding the following data to tabId: ${tabId}`, data);
      chrome.tabs
        .sendMessage(tabId, { type: "FROM_EXTENSION", data })
        .catch((error) => {
          // Handle cases where content script is not available
          // This is expected for pages without form fields or restricted pages
          const errorMessage = error?.message || String(error);
          if (
            errorMessage.includes("Receiving end does not exist") ||
            errorMessage.includes("Could not establish connection")
          ) {
            // Expected case - log at debug level
            logger.debug("[generateKeypair] Content script not available on this page (expected for some pages)");
          } else {
            // Unexpected error - log for debugging
            logger.debug("[generateKeypair] Failed to send message:", error);
          }
        });
    }
  };

  const openTab = async () => {
    const tab = await chrome.tabs.create({ url: `${CHAIN_CONFIGS[chainId].dappUrl}/updatePublicKey` });
    if (tab.id) setTabIds([...tabIds, tab.id]);
  };

  if (keypairExists) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl mb-4">Generate Keypair</h1>
          <div className="relative w-full flex items-center justify-center">
            <div className="mt-2 flex flex-col gap-2 items-center justify-center space-x-2 cursor-pointer">
              <p className="text-xl p-4 my-4">
                Next, please publish your public key to the blockchain by
                clicking on the buttons below.
              </p>
              {/* <p className="text-xl border-red-700 p-4 my-4 border rounded-md">
                Warning: Although you have generated a keypair (for encrypting
                and decrypting messages), your public key is not yet available
                for others to see. To make your public key available, you must
                first send it to the blockchain.
              </p> */}
              <Button
                variant="outline"
                className="px-4 py-2 bg-slate-600 hover:bg-slate-600 hover:opacity-80 active:opacity-60"
                onClick={openTab}
              >
                Open UpdatePublicKey page in dApp
              </Button>
              <Button
                variant="outline"
                className="px-4 py-2 bg-slate-600 hover:bg-slate-600 hover:opacity-80 active:opacity-60"
                onClick={() => {
                  sendData();
                  setSent(true);
                }}
                disabled={sent}
              >
                Send Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl mb-4">Generate Keypair</h1>
        <div className="relative w-full flex items-center justify-center">
          <div className="mt-2 flex flex-col items-center justify-center space-x-2 cursor-pointer">
            <Button
              variant="outline"
              className="px-4 py-2 bg-slate-600 hover:bg-slate-600 hover:opacity-80 active:opacity-60"
              onClick={async () => {
                const key = await genKey();
                const keyPairCred = await createKeypairCred(key);

                setPendingCreds((prev) => [...prev, keyPairCred]);
                setKeypairs((prev) => [...prev, keyPairCred]);
              }}
            >
              Generate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
