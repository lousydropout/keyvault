import { Button } from "@/components/ui/button";
import { CREDENTIALS, ENCRYPTEDS, PUBKEY } from "@/constants/hookVariables";
import { LOCALHOST } from "@/constants/networks";
import { WELCOME } from "@/constants/steps";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import { Cred } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";

const download = (data: Record<string, any>, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};

const logOut = async () => {
  await chrome.storage.local.set({
    step: WELCOME,

    network: LOCALHOST,

    // Reset all the creds-related data
    pubkey: "",
    jwk: null,
    credentials: [],
    encrypteds: [],
    numEntries: -1,
  });
};

export const Settings = () => {
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");
  const [jwk] = useCryptoKeyManager();
  const [encrypteds] = useBrowserStoreLocal<Encrypted[]>(ENCRYPTEDS, []);
  const [creds] = useBrowserStoreLocal<Cred[]>(CREDENTIALS, []);

  return (
    <div className="flex flex-col gap-4 justify-end">
      <h3 className="mt-8 mb-4 text-center text-lg">
        Wallet address: {pubkey || "N/A"}
      </h3>

      {/* encryption key */}
      <h3 className="mt-8 mb-4 text-center text-lg">Encryption key</h3>
      <Button
        variant="secondary"
        onClick={() => download(jwk as JsonWebKey, "encryption_key.json")}
      >
        Download encryption key
      </Button>

      {/* credentials */}
      <h3 className="mt-8 mb-4 text-center text-lg">Credentials</h3>
      <Button
        variant="secondary"
        onClick={() => download(encrypteds, "encrypted_credentials.json")}
      >
        Download (encrypted) credentials
      </Button>
      <Button
        variant="secondary"
        onClick={() => download(creds, "unencrypted_credentials.json")}
      >
        Download (unencrypted) credentials
      </Button>

      {/* log out */}
      <Button variant="destructive" onClick={logOut}>
        Log out
      </Button>
    </div>
  );
};
