import { Header, View } from "@/components/header";
import { useChromeStoreLocal } from "@/hooks/useChromeStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import "@/index.css";
import { PubkeyRequest } from "@/side_panel/PubkeyRequest";
import { AddCred } from "@/side_panel/addCred";
import { Credentials } from "@/side_panel/credentials";
import { EncryptionKeySetup } from "@/side_panel/encryptionKeySetup";
import { Settings } from "@/side_panel/settings";
import { DASHBOARD, SETUP_ENCRYPTION_KEY, WELCOME } from "@/side_panel/steps";
import { Sync } from "@/side_panel/sync";
import { Cred, decryptEntry } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { getEntries } from "@/utils/getEntries";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Hex } from "viem";

// const merge = (onChain: Encrypted[], curr: Encrypted[]): Encrypted[] =>{

//   return []
// }

export const Root = () => {
  const [step, setStep] = useChromeStoreLocal<number>("step", WELCOME);
  const [view, setView] = useState<View>("Current Page");
  const [pubkey] = useChromeStoreLocal<string>("pubkey", "");
  const [_jwk, _setJwk, cryptoKey] = useCryptoKeyManager();
  const [numOnChain, setNumOnChain] = useChromeStoreLocal<number>(
    "numEntries",
    -1
  );
  const [encrypteds, setEncrypteds] = useChromeStoreLocal<Encrypted[]>(
    `encrypteds`,
    []
  );
  const [creds, setCreds] = useChromeStoreLocal<Cred[]>("credentials", []);
  const [ocCreds, setOcCreds] = useState<Cred[]>([]);

  const queryOnChainIfNeeded = async () => {
    // TODO: figure out merge logic

    const entries = await getEntries(pubkey as Hex, 0, 10);
    console.log("entries: ", entries);
    setOcCreds([]);
    for (let i = 0; i < entries.length; i++) {
      decryptEntry(cryptoKey as CryptoKey, entries[i]).then((cred) => {
        console.log("i=", i, cred);
        i === 0 ? setOcCreds([cred]) : setOcCreds((prev) => [...prev, cred]);
      });
    }
  };

  useEffect(() => {
    console.log("on-chain creds: ", ocCreds);
  }, [ocCreds]);

  // query and convert on-chain entries to creds automatically
  useEffect(() => {
    if (!cryptoKey) return;

    if (numOnChain > encrypteds.filter((e) => e.onChain).length) {
      // query entries on chain
      const limit = numOnChain - encrypteds.length;
      const _encrypteds = structuredClone(encrypteds);
      getEntries(pubkey as Hex, encrypteds.length, limit).then((newEntries) => {
        for (let i = 0; i < newEntries.length; i++) {
          _encrypteds.push(newEntries[i]);
        }
        setEncrypteds(_encrypteds);
      });
    }
  }, [numOnChain, cryptoKey]);

  useEffect(() => {
    if (!cryptoKey || !encrypteds) return;

    const startIdx = creds.length;
    if (encrypteds.length > startIdx) {
      for (let i = startIdx; i < encrypteds.length; i++) {
        decryptEntry(cryptoKey as CryptoKey, encrypteds[i]).then((cred) => {
          setCreds((prev) => [...prev, cred]);
        });
      }
    }
  }, [encrypteds, cryptoKey]);

  return (
    <>
      {/* 1. Enter pubkey */}
      {step === WELCOME && <PubkeyRequest setStep={setStep} />}

      {/* 2. Setup encryption key */}
      {step === SETUP_ENCRYPTION_KEY && (
        <EncryptionKeySetup setStep={setStep} />
      )}

      {/* 3. Dashboard */}
      {step === DASHBOARD && (
        <>
          <Header
            queryOnChainIfNeeded={queryOnChainIfNeeded}
            view={view}
            setView={setView}
          />
          {view === "All Credentials" && <Credentials />}
          {view === "Current Page" && <Credentials />}
          {view === "Settings" && <Settings />}
          {view === "Sync" && <Sync />}
          {view === "New Credential" && <AddCred setView={setView} />}
        </>
      )}
    </>
  );
};

ReactDOM.render(<Root />, document.getElementById("root"));
