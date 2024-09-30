import { View } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CREDENTIALS, VIEW } from "@/constants/hookVariables";
import { useChromeStore, useChromeStoreLocal } from "@/hooks/useChromeStore";
import { Cred, isKeypairCred } from "@/utils/credentials";
import {
  ArmoredKey,
  encryptMessage,
  importPrivateKey,
  importPublicKey,
} from "@/utils/openpgp";
import { useEffect, useState } from "react";

export const EncryptMessage = () => {
  const [creds] = useChromeStoreLocal<Cred[]>(CREDENTIALS, []);
  const [_view, setView] = useChromeStore<View>(VIEW, "New Credential");

  const [publicKey, setPublicKey] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<ArmoredKey>({
    body: "",
    crc: "",
  });
  const [message, setMessage] = useState<string>("");
  const [ciphertext, setCiphertext] = useState<string>("");

  useEffect(() => {
    if (!creds) return;

    for (const cred of [...creds].reverse()) {
      if (isKeypairCred(cred)) {
        setPrivateKey(cred.privateKey);
        break;
      }
    }
  }, [creds]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl mb-4">Encrypt message</h1>
        <div className="relative w-full flex flex-col items-center gap-4">
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="description" className="block text-xl">
              Recipient's public key
            </Label>
            <Textarea
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="Enter recipient's public key"
              className="w-full border border-gray-300 px-3 py-2 rounded bg-transparent text-lg text-nowrap"
            />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="description" className="block text-xl">
              Message
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the message you wish to encrypt"
              className="border border-gray-300 px-3 py-2 rounded bg-transparent text-lg"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
            disabled={!message || !publicKey}
            onClick={async () => {
              // encrypt message
              const encryptedMessage = await encryptMessage({
                message,
                receviersPublicKey: await importPublicKey(publicKey),
                privateKey: await importPrivateKey(privateKey),
              });
              setCiphertext(encryptedMessage);
            }}
          >
            Encrypt
          </Button>
        </div>
        <div className="relative w-full flex flex-col items-center gap-4 mt-8">
          <div className="flex flex-col gap-2 w-full">
            <h3 className="block text-2xl">Message ciphertext</h3>
            <pre className="w-full min-h-24 border border-gray-300 px-3 py-2 rounded bg-transparent text-lg overflow-x-scroll">
              {ciphertext}
            </pre>
            <Button
              variant="outline"
              className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
              onClick={() => navigator.clipboard.writeText(ciphertext)}
            >
              Copy Ciphertext
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
