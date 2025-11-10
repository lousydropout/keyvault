import { Header, View } from "@/components/header";
import {
  CREDS_BY_URL,
  ENCRYPTEDS,
  KEYPAIRS,
  NUM_ENTRIES,
  PENDING_CREDS,
  PUBKEY,
  SECRET_SHARES,
  STEP,
  VIEW,
} from "@/constants/hookVariables";
import { DASHBOARD, SETUP_ENCRYPTION_KEY, WELCOME } from "@/constants/steps";
import { useBrowserStore, useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import { logger } from "@/utils/logger";
import "@/index.css";
import { PubkeyRequest } from "@/side_panel/PubkeyRequest";
import { AddCred } from "@/side_panel/addCred";
import { Credentials } from "@/side_panel/credentials";
import { EditCred } from "@/side_panel/editCred";
import { EncryptDecrypt } from "@/side_panel/encryptDecrypt";
import { EncryptionKeySetup } from "@/side_panel/encryptionKeySetup";
import { GenerateKeypair } from "@/side_panel/generateKeypair";
import { Settings } from "@/side_panel/settings";
import { Sync } from "@/side_panel/sync";
import {
  Cred,
  CredsByUrl,
  DecryptionError,
  decryptAndCategorizeEntries,
  decryptEntries,
  KeypairCred,
  mergeCredsByUrl,
  SecretShareCred,
} from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { getEntries } from "@/utils/getEntries";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Hex } from "viem";

export const Root = () => {
  const [step, setStep] = useBrowserStoreLocal<number>(STEP, WELCOME);
  const [view] = useBrowserStore<View>(VIEW, "Current Page");
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");
  const [_jwk, _setJwk, cryptoKey] = useCryptoKeyManager();
  const [numOnChain] = useBrowserStoreLocal<number>(NUM_ENTRIES, -1);
  const [encrypteds, setEncrypteds] = useBrowserStoreLocal<Encrypted[]>(
    ENCRYPTEDS,
    []
  );
  const [_credsByUrl, setCredsByUrl] = useBrowserStoreLocal<CredsByUrl>(
    CREDS_BY_URL,
    {}
  );
  const [pendingCreds, setPendingCreds] = useBrowserStoreLocal<Cred[]>(
    PENDING_CREDS,
    []
  );
  const [_keypairs, setKeypairs] = useBrowserStoreLocal<KeypairCred[]>(
    KEYPAIRS,
    []
  );
  const [_secretShares, setSecretShares] = useBrowserStoreLocal<
    SecretShareCred[]
  >(SECRET_SHARES, []);
  const [decryptionErrors, setDecryptionErrors] = useState<DecryptionError[]>(
    []
  );

  // Retry failed decryptions
  const retryFailed = async () => {
    if (!cryptoKey || decryptionErrors.length === 0) return;

    // Extract failed entries
    const failedEntries = decryptionErrors
      .map((err) => err.encrypted)
      .filter((enc): enc is Encrypted => enc !== undefined);

    if (failedEntries.length === 0) {
      setDecryptionErrors([]);
      return;
    }

    // Retry decryption for failed entries
    const result = await decryptEntries(cryptoKey, failedEntries);

    if (result.errors.length === 0) {
      // All retries succeeded, clear errors
      setDecryptionErrors([]);
      // Re-run full decryption to update all credentials
      decryptAndCategorizeEntries(
        cryptoKey as CryptoKey,
        encrypteds,
        pendingCreds
      ).then((decrypted) => {
        setCredsByUrl((prev) => mergeCredsByUrl(prev, decrypted.passwords));
        setKeypairs(decrypted.keypairs);
        setSecretShares(decrypted.secretShares);
        setPendingCreds(decrypted.pendings);
        setDecryptionErrors(decrypted.errors);
      });
    } else {
      // Some retries still failed, update error state
      setDecryptionErrors(result.errors);
    }
  };

  // query and convert on-chain entries to creds automatically
  useEffect(() => {
    if (!cryptoKey || step !== DASHBOARD) return;

    logger.debug(
      "[Main] numOnChain, encrypteds.length: ",
      numOnChain,
      encrypteds.length
    );
    if (numOnChain > encrypteds.length) {
      // query entries on chain
      const limit = numOnChain - encrypteds.length;
      const updatedEncrypteds = structuredClone(encrypteds);

      getEntries(pubkey as Hex, encrypteds.length, limit)
        .then((newEntries) => {
          logger.debug("[Main] getEntries: ", JSON.stringify(newEntries));
          updatedEncrypteds.push(...newEntries);
          setEncrypteds(updatedEncrypteds);

          return decryptAndCategorizeEntries(
            cryptoKey as CryptoKey,
            updatedEncrypteds,
            pendingCreds
          );
        })
        .then((decrypted) => {
          logger.debug(
            "[Main] decryptAndCategorizeEntries: ",
            JSON.stringify(decrypted)
          );
          setCredsByUrl((prev) => mergeCredsByUrl(prev, decrypted.passwords));
          setKeypairs(decrypted.keypairs);
          setSecretShares(decrypted.secretShares);
          setPendingCreds(decrypted.pendings);
          setDecryptionErrors(decrypted.errors);
        })
        .catch((error) => {
          logger.error("[Main] Error in decryption flow:", error);
          // Don't set errors here as decryptAndCategorizeEntries handles its own errors
        });
    } else if (encrypteds.length > 0) {
      // Decrypt existing entries to check for errors (only if we have entries)
      decryptAndCategorizeEntries(
        cryptoKey as CryptoKey,
        encrypteds,
        pendingCreds
      )
        .then((decrypted) => {
          setCredsByUrl((prev) => mergeCredsByUrl(prev, decrypted.passwords));
          setKeypairs(decrypted.keypairs);
          setSecretShares(decrypted.secretShares);
          setPendingCreds(decrypted.pendings);
          setDecryptionErrors(decrypted.errors);
        })
        .catch((error) => {
          logger.error("[Main] Error in decryption flow:", error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numOnChain, cryptoKey, step]);

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
          {decryptionErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-500 p-2 rounded-md text-sm text-red-400 mx-4 mt-2">
              {decryptionErrors.length} credential(s) failed to decrypt.
              <button
                onClick={retryFailed}
                className="ml-2 underline hover:text-red-300"
              >
                Retry
              </button>
            </div>
          )}
          {view === "All Credentials" && <Credentials />}
          {view === "Current Page" && <Credentials />}
          {view === "Settings" && <Settings />}
          {view === "Sync" && <Sync />}
          {view === "New Credential" && <AddCred />}
          {view === "Edit Credential" && <EditCred />}
          {view === "Generate Keypair" && <GenerateKeypair />}
          {view === "Encrypt message" && <EncryptDecrypt />}
        </>
      )}
    </>
  );
};

ReactDOM.render(<Root />, document.getElementById("root"));
