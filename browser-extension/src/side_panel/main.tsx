import { Header, View } from "@/components/header";
import {
  CREDENTIALS,
  ENCRYPTEDS,
  MODIFIED_ENCRYPTEDS,
  NUM_ENTRIES,
  PUBKEY,
  STEP,
  VIEW,
} from "@/constants/hookVariables";
import { DASHBOARD, SETUP_ENCRYPTION_KEY, WELCOME } from "@/constants/steps";
import { useChromeStore, useChromeStoreLocal } from "@/hooks/useChromeStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import "@/index.css";
import { PubkeyRequest } from "@/side_panel/PubkeyRequest";
import { AddCred } from "@/side_panel/addCred";
import { Credentials } from "@/side_panel/credentials";
import { EditCred } from "@/side_panel/editCred";
import { EncryptionKeySetup } from "@/side_panel/encryptionKeySetup";
import { Settings } from "@/side_panel/settings";
import { Sync } from "@/side_panel/sync";
import { Cred, decryptEntries } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { getEntries } from "@/utils/getEntries";
import { useEffect } from "react";
import ReactDOM from "react-dom";
import { Hex } from "viem";

export const Root = () => {
  const [step, setStep] = useChromeStoreLocal<number>(STEP, WELCOME);
  const [view] = useChromeStore<View>(VIEW, "Current Page");
  const [pubkey] = useChromeStoreLocal<string>(PUBKEY, "");
  const [_jwk, _setJwk, cryptoKey] = useCryptoKeyManager();
  const [numOnChain] = useChromeStoreLocal<number>(NUM_ENTRIES, -1);
  const [encrypteds, setEncrypteds] = useChromeStoreLocal<Encrypted[]>(
    ENCRYPTEDS,
    []
  );
  const [modifiedEncrypteds, setModifiedEncrypteds] =
    useChromeStoreLocal<boolean>(MODIFIED_ENCRYPTEDS, false);
  const [_creds, setCreds] = useChromeStoreLocal<Cred[]>(CREDENTIALS, []);

  // query and convert on-chain entries to creds automatically
  useEffect(() => {
    if (!cryptoKey || step !== DASHBOARD) return;

    if (numOnChain > encrypteds.filter((e) => e.onChain).length) {
      // query entries on chain
      const limit = numOnChain - encrypteds.length;
      const updatedEncrypteds = structuredClone(encrypteds);

      getEntries(pubkey as Hex, encrypteds.length, limit).then((newEntries) => {
        updatedEncrypteds.push(...newEntries);
        setEncrypteds(updatedEncrypteds);

        decryptEntries(cryptoKey as CryptoKey, updatedEncrypteds).then(
          (decryptedCreds) => {
            console.log("[Root] decryptedCreds: ", decryptedCreds);
            setCreds(decryptedCreds);
          }
        );
      });
    }
  }, [numOnChain, cryptoKey, step]);

  useEffect(() => {
    if (!(modifiedEncrypteds && cryptoKey && step === DASHBOARD)) return;

    decryptEntries(cryptoKey as CryptoKey, encrypteds).then(
      (decryptedCreds) => {
        console.log(
          "[Root modifiedEncrypteds] decryptedCreds: ",
          decryptedCreds
        );
        setCreds(decryptedCreds);
        setModifiedEncrypteds(false);
      }
    );
  }, [encrypteds, cryptoKey, modifiedEncrypteds, step]);

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
          <Header />
          {view === "All Credentials" && <Credentials />}
          {view === "Current Page" && <Credentials />}
          {view === "Settings" && <Settings />}
          {view === "Sync" && <Sync />}
          {view === "New Credential" && <AddCred />}
          {view === "Edit Credential" && <EditCred />}
        </>
      )}
    </>
  );
};

ReactDOM.render(<Root />, document.getElementById("root"));
