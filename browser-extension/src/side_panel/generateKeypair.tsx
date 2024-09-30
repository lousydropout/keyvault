import { View } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  CREDENTIALS,
  ENCRYPTEDS,
  MODIFIED_ENCRYPTEDS,
  PRIVATE_KEY,
  PUBLIC_KEY,
  VIEW,
} from "@/constants/hookVariables";
import { useBrowserStore, useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import { createKeypairCred, Cred, isKeypairCred } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { genKey } from "@/utils/openpgp";
import { useEffect, useState } from "react";

export const GenerateKeypair = () => {
  const [_jwk, _setJwk, cryptoKey] = useCryptoKeyManager();
  const [encrypteds, setEncrypteds] = useBrowserStoreLocal<Encrypted[]>(
    ENCRYPTEDS,
    []
  );
  const [creds] = useBrowserStoreLocal<Cred[]>(CREDENTIALS, []);
  const [publicKey, setPublicKey] = useBrowserStoreLocal<string>(
    PUBLIC_KEY,
    ""
  );
  const [privateKey, setPrivateKey] = useBrowserStoreLocal<string>(
    PRIVATE_KEY,
    ""
  );
  const [_modifiedEncrypteds, setModifiedEncrypteds] =
    useBrowserStoreLocal<boolean>(MODIFIED_ENCRYPTEDS, false);
  const [_view, setView] = useBrowserStore<View>(VIEW, "New Credential");
  const [keypairExists, setKeypairExists] = useState<boolean>(false);

  useEffect(() => {
    for (const cred of creds) {
      if (isKeypairCred(cred)) {
        setKeypairExists(true);
        break;
      }
    }
  }, [creds]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl mb-4">Generate Keypair</h1>
        <div className="relative w-full flex items-center justify-center">
          <div className="mt-2 flex flex-col items-center justify-center space-x-2 cursor-pointer">
            {keypairExists && (
              <p className="text-xl border-red-700 p-4 my-4 border rounded-md">
                Warning: Keyvault currently only allows 1 keypair at a time.
                Accordingly, generating a new keypair will make the previous
                keypair inaccessible.
              </p>
            )}
            <Button
              variant="outline"
              className="px-4 py-2 bg-slate-600 hover:bg-slate-600 hover:opacity-80 active:opacity-60"
              onClick={async () => {
                const { keyId, publicKey, privateKey } = await genKey();
                console.log({ keyId, publicKey, privateKey });

                const keyPairCred = await createKeypairCred(
                  cryptoKey as CryptoKey,
                  { keyId, privateKey, publicKey },
                  encrypteds.length,
                  -1
                );

                setEncrypteds((values) => [...values, keyPairCred.encrypted]);
                setModifiedEncrypteds(true);

                setView("All Credentials");
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
