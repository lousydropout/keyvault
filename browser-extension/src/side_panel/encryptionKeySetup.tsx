import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChromeStoreLocal } from "@/hooks/useChromeStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import { DASHBOARD } from "@/side_panel/steps";
import { importCryptoKey } from "@/utils/encryption";
import { getNumEntries } from "@/utils/getNumEntries";
import { download } from "@/utils/utility";
import { useEffect, useState } from "react";
import { Hex } from "viem";

type EncryptionKeySetupProps = {
  setStep: (step: number) => void;
};
export const EncryptionKeySetup = ({ setStep }: EncryptionKeySetupProps) => {
  const [pubkey] = useChromeStoreLocal<string>("pubkey", "");
  const [jwk, setJwk, _, generateKeyHandler] = useCryptoKeyManager();
  const [numOnChain, setNumOnChain] = useChromeStoreLocal<number>(
    "numEntries",
    -1
  );

  useEffect(() => {
    if (!pubkey) return;

    getNumEntries(pubkey as Hex).then((num) => {
      if (num !== undefined) setNumOnChain(num);
    });
  }, [pubkey]);

  useEffect(() => {
    if (numOnChain === 0 && !jwk) generateKeyHandler();
  }, [numOnChain]);

  type CreatingOrResetingAccountProps = {
    isNew: boolean;
  };

  const CreatingOrResetingAccount = ({
    isNew,
  }: CreatingOrResetingAccountProps) => {
    return (
      <div className="flex flex-col gap-4 px-2 py-4">
        <h1 className="text-4xl text-center mt-4">
          {isNew ? "No account was detected" : "Account reset"}
        </h1>
        <p className="text-xl mt-4">
          A new encryption key has been generated for you.
        </p>
        <p className="text-xl mt-4">
          Please download a copy of the key and keep it safe.
        </p>
        <Button
          className="border rounded-xl"
          onClick={() => download(jwk ?? {}, "encryption_key.json")}
        >
          Download encryption key
        </Button>

        <p className="text-xl mt-4">When ready, click "Done with setup".</p>
        <Button
          className="border rounded-xl"
          onClick={() => setStep(DASHBOARD)}
        >
          Done with setup
        </Button>
      </div>
    );
  };

  const ExistingAccount = () => {
    const [tmpJwk, setTmpJwk] = useState<JsonWebKey | null>(null);
    const [importAccount, setImportAccount] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    console.log("ExistingAccount");

    const importJwk = async () => {
      setErrorMessage(null);
      if (!tmpJwk) return;
      try {
        const _ = await importCryptoKey(tmpJwk ?? {});
        // the string was a valid JWK if no error was thrown
        setJwk(tmpJwk);
        setStep(DASHBOARD);
      } catch (e) {
        console.log("Error importing key: ", e);
        setErrorMessage("Invalid encryption key");
      }
    };

    const updateTmpJwk = () => {
      const _jwkString = (
        document.getElementById("jwkInput") as HTMLInputElement
      ).value;
      const _jwk = JSON.parse(_jwkString) as JsonWebKey;
      setTmpJwk(_jwk);
    };

    useEffect(() => {
      if (tmpJwk) importJwk();
    }, [tmpJwk]);

    if (importAccount === null) {
      return (
        <div className="flex flex-col gap-4 px-2 py-4">
          <h1 className="text-4xl text-center mt-4">We found your account</h1>
          <p className="text-xl mt-4">
            Would you like to import your encryption key or reset your account?
          </p>
          <div className="flex gap-4">
            <Button
              className="border rounded-xl"
              onClick={() => setImportAccount(true)}
            >
              Import encryption key
            </Button>
            <Button
              className="border rounded-xl"
              onClick={() => setImportAccount(false)}
            >
              Reset account
            </Button>
          </div>
        </div>
      );
    } else if (importAccount) {
      return (
        <div className="flex flex-col gap-4 px-2 py-4">
          <h1 className="text-4xl text-center mt-4">Import encryption key</h1>
          <p className="text-xl mt-4">
            Please paste your encryption key (JWT format) here:
          </p>
          <Textarea id="jwkInput" className="min-h-24" />
          {errorMessage && <p className="text-red-400">{errorMessage}</p>}
          <Button className="border rounded-xl" onClick={updateTmpJwk}>
            Import key
          </Button>
        </div>
      );
    } else if (!importAccount) {
      return <CreatingOrResetingAccount isNew={false} />;
    }
  };

  if (numOnChain === 0) {
    return <CreatingOrResetingAccount isNew={true} />;
  } else if (numOnChain > 0) {
    return <ExistingAccount />;
  } else if (numOnChain === undefined) {
    return (
      <div className="flex flex-col gap-4 px-2 py-4">
        <h1 className="text-4xl text-center">Error</h1>
        <h2 className="text-2xl mt-8">
          Something went wrong and we don't know what.
        </h2>
        <h4 className="text-sm">{jwk?.k ?? "N/A"}</h4>
        <Button className="border rounded-xl" onClick={generateKeyHandler}>
          New key
        </Button>
      </div>
    );
  } else {
    return <h1>Loading...</h1>;
  }
};
