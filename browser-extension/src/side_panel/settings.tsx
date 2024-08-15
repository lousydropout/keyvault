import { Button } from "@/components/ui/button";
import { useChromeStorageLocal } from "@/hooks/useChromeLocalStorage";
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
  await chrome.storage.local.clear();
};

export const Settings = () => {
  const [pubkey] = useChromeStorageLocal<string>("pubkey", "");
  const [jwk] = useCryptoKeyManager();
  const [encrypteds] = useChromeStorageLocal<Encrypted[]>(`encrypteds`, []);
  const [creds] = useChromeStorageLocal<Cred[]>("credentials", []);

  return (
    <div className="flex flex-col justify-end">
      <h3 className="mt-8 mb-4 text-center text-lg">
        Wallet address: {pubkey || "N/A"}
      </h3>

      {/* encryption key */}
      <h3 className="mt-8 mb-4 text-center text-lg">Encryption key</h3>
      <Button
        className="py-4 text-white border rounded-xl"
        onClick={() => download(jwk as JsonWebKey, "encryption_key.json")}
      >
        Download encryption key
      </Button>

      {/* credentials */}
      <h3 className="mt-8 mb-4 text-center text-lg">Credentials</h3>
      <Button
        className="py-4 bg-primary text-white border rounded-xl"
        onClick={() => download(encrypteds, "encrypted_credentials.json")}
      >
        Download (encrypted) credentials
      </Button>
      <Button
        className="py-4 my-4 bg-secondary text-white border rounded-xl"
        onClick={() => download(creds, "unencrypted_credentials.json")}
      >
        Download (unencrypted) credentials
      </Button>

      {/* log out */}
      <Button
        className="mt-40 py-4 bg-warning text-white border rounded-xl"
        onClick={logOut}
      >
        Log out
      </Button>
    </div>
  );
};
