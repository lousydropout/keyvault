import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { KEYPAIRS } from "@/constants/hookVariables";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { KeypairCred } from "@/utils/credentials";
import { importPrivateKey } from "@/utils/openpgp";
import { PrivateKey } from "openpgp";

import { DecryptMessage } from "@/side_panel/decrypt";
import { EncryptMessage } from "@/side_panel/encrypt";
import { useEffect, useState } from "react";

export const EncryptDecrypt = () => {
  const [creds] = useBrowserStoreLocal<KeypairCred[]>(KEYPAIRS, []);
  const [encryptionMode, setEncryptionMode] = useState<boolean>(true);
  const [privateKey, setPrivateKey] = useState<PrivateKey | undefined>(
    undefined
  );

  useEffect(() => {
    if (creds.length === 0) return;

    const _privateKey = creds[creds.length - 1].privateKey;
    if (_privateKey) {
      importPrivateKey(_privateKey).then((key) => setPrivateKey(key));
    }
  }, [creds]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex flex-col items-center">
        <div>
          <div className="my-4 flex items-center justify-center space-x-2 cursor-pointer">
            <Switch
              id="see-all-mode"
              checked={encryptionMode}
              onCheckedChange={() => setEncryptionMode((prev) => !prev)}
              className="border-purple-200"
            />
            <Label htmlFor="see-all-mode" className="text-4xl">
              <h1>{encryptionMode ? "Encrypt" : "Decrypt"}</h1>
            </Label>
          </div>
        </div>
        {!privateKey && (
          <p className="text-red-400 my-4 text-lg">
            No encryption key found. Please generate one first.
          </p>
        )}
        {encryptionMode && privateKey ? (
          <EncryptMessage privateKey={privateKey as PrivateKey} />
        ) : (
          <DecryptMessage privateKey={privateKey as PrivateKey} />
        )}
      </div>
    </div>
  );
};
