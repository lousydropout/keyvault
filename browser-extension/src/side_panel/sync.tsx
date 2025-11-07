import { Button } from "@/components/ui/button";
import { chain } from "@/config";
import { NUM_ENTRIES, PENDING_CREDS, PUBKEY } from "@/constants/hookVariables";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import { useCurrentTab } from "@/hooks/useCurrentTab";
import { logger } from "@/utils/logger";
import { Cred, encryptEntries } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { getNumEntries } from "@/utils/getNumEntries";
import { useEffect, useState } from "react";
import { Hex } from "viem";

export const Sync = () => {
  const [tab] = useCurrentTab();
  const tabId = tab?.id || chrome.tabs.TAB_ID_NONE;
  const [pendingCreds] = useBrowserStoreLocal<Cred[]>(PENDING_CREDS, []);
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");
  const [numEntries, setNumEntries] = useBrowserStoreLocal<number>(
    NUM_ENTRIES,
    -1
  );
  const [encrypted, setEncrypted] = useState<Encrypted>({
    iv: "",
    ciphertext: "",
  });
  const [_jwt, _setJwt, cryptoKey] = useCryptoKeyManager();
  const [sent, setSent] = useState(false);

  const getEncrypted = async () => {
    const _encrypted = await encryptEntries(
      cryptoKey as CryptoKey,
      pendingCreds
    );
    setEncrypted(_encrypted);
  };

  useEffect(() => {
    if (pendingCreds.length === 0) return;
    if (!cryptoKey) return;

    getEncrypted();
  }, [cryptoKey, pendingCreds]);

  const sendData = async (tabId: number) => {
    logger.debug("[sendData]: ", { pendingCreds, pubkey, numEntries });
    // message does not contain any unencrypted or sensitive data
    if (cryptoKey === null) return;

    const data = {
      encrypted,
      address: pubkey,
      numEntries,
      overwrite: true,
      chainId: chain.id,
    };

    logger.debug(`Forwarding the following data to tabId: ${tabId}`, data);
    chrome.tabs.sendMessage(tabId, { type: "FROM_EXTENSION", data });
  };

  // note: convoluted logic to periodically query numEntries
  //   starting when the user clicks the "Send data to dApp" button
  //   and stopping when numEntries is updated
  const updateNumEntries = async () => {
    getNumEntries(pubkey as Hex).then((num) => {
      if (num && num !== numEntries) {
        setNumEntries(num);
        setSent(false);
      }
    });
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (sent) updateNumEntries();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [sent]);

  return (
    <div className="flex flex-col items-center justify-start gap-2 p-4">
      <h1 className="mb-16 text-4xl">Sync</h1>
      <Button
        variant="outline"
        className="w-fit bg-purple-500 hover:bg-purple-600 active:bg-purple-800 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
        onClick={() => {
          setSent(true);
          sendData(tabId);
        }}
        disabled={pendingCreds.length === 0 || sent}
      >
        {pendingCreds.length > 0 ? "Send data to dApp" : "No data to send"}
      </Button>
    </div>
  );
};
