import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { KEYPAIRS } from "@/constants/hookVariables";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { KeypairCred } from "@/utils/credentials";
import { getPublicKey } from "@/utils/getPublicKey";
import {
  decryptMessage,
  encryptMessage,
  importPrivateKey,
  importPublicKey,
} from "@/utils/openpgp";
import { PrivateKey } from "openpgp";

import { useEffect, useRef, useState } from "react";
import { Hex } from "viem";

export const EncryptMessage = () => {
  const [creds] = useBrowserStoreLocal<KeypairCred[]>(KEYPAIRS, []);
  const [privateKey, setPrivateKey] = useState<PrivateKey | undefined>(
    undefined
  );
  const [encryptionMode, setEncryptionMode] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (creds.length === 0) return;

    const _privateKey = creds[creds.length - 1].privateKey;
    if (_privateKey) {
      importPrivateKey(_privateKey).then((key) => setPrivateKey(key));
    }
  }, [creds]);

  const DecryptMessage = () => {
    const [message, setMessage] = useState<string>("");
    const publicKeyInput = useRef<HTMLInputElement>(null);
    const ciphertextInput = useRef<HTMLTextAreaElement>(null);
    const [pubkey, setPubkey] = useState<string>("");

    return (
      <>
        <div className="relative w-full flex flex-col items-center gap-4">
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="description" className="block text-xl">
              Sender's address (used to verify message signature)
            </Label>
            <Input
              ref={publicKeyInput}
              placeholder="Enter recipient's public key"
              className="w-full border border-gray-300 px-3 py-2 rounded bg-transparent text-lg text-nowrap"
            />
            <Button
              variant="outline"
              className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
              onClick={async () => {
                setError("");
                const _publicKey = publicKeyInput.current?.value ?? "";
                try {
                  const _pubkey = await getPublicKey(_publicKey as Hex);
                  setPubkey(_pubkey);
                } catch (e) {
                  setError("Failed to retrieve recipient's pubkey");
                }
              }}
            >
              Retrieve sender's pubkey
            </Button>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="decrypt-message" className="block text-xl">
              Message to decrypt
            </Label>
            <Textarea
              id="decrypt-message"
              ref={ciphertextInput}
              placeholder="Enter message to decrypt"
              className="w-full border border-gray-300 px-3 py-2 rounded bg-transparent text-lg text-nowrap"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
            disabled={pubkey === ""}
            onClick={async () => {
              if (!privateKey) return;
              setError("");

              // encrypt message
              const ciphertext = ciphertextInput.current?.value ?? "";
              const { isValid, plaintext, signedBy } = await decryptMessage({
                ciphertext,
                sendersPublicKey: await importPublicKey(pubkey),
                privateKey,
              });
              <EncryptMessage />;
              if (!isValid) {
                if (signedBy === "missing signature") {
                  setError("Invalid signature");
                } else {
                  setError("Incorrect public key");
                }
              } else {
                setMessage(plaintext);
              }
            }}
          >
            Decrypt
          </Button>
        </div>
        <div className="relative w-full flex flex-col items-center gap-4 mt-8">
          <div className="flex flex-col gap-2 w-full">
            <h3 className="block text-2xl">Message</h3>
            <pre className="w-full min-h-24 border border-gray-300 px-3 py-2 rounded bg-transparent text-lg overflow-x-auto">
              {message}
            </pre>
            <Button
              variant="outline"
              className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
              onClick={() => navigator.clipboard.writeText(message)}
              disabled={!message}
            >
              Copy message
            </Button>
          </div>
        </div>
      </>
    );
  };

  const EncryptMessage = () => {
    const publicKeyInput = useRef<HTMLInputElement>(null);
    const messageInput = useRef<HTMLTextAreaElement>(null);
    const [ciphertext, setCiphertext] = useState<string>("");
    const [pubkey, setPubkey] = useState<string>("");

    return (
      <>
        <div className="relative w-full flex flex-col items-center gap-4">
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="description" className="block text-xl">
              Recipient's address
            </Label>
            <Input
              ref={publicKeyInput}
              placeholder="Enter recipient's public key"
              className="w-full border border-gray-300 px-3 py-2 rounded bg-transparent text-lg text-nowrap"
            />
            <Button
              variant="outline"
              className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
              onClick={async () => {
                setError("");
                try {
                  const _publicKey = publicKeyInput.current?.value ?? "";
                  console.log(
                    "_publicKey: ",
                    _publicKey,
                    !_publicKey ? "okay" : "not okay"
                  );
                  const _pubkey = await getPublicKey(_publicKey as Hex);
                  setPubkey(_pubkey);
                } catch (e) {
                  setError("Failed to retrieve sender's pubkey");
                }
              }}
            >
              Retrieve recipient's pubkey
            </Button>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="description" className="block text-xl">
              Message
            </Label>
            <Textarea
              ref={messageInput}
              placeholder="Enter the message you wish to encrypt"
              className="border border-gray-300 px-3 py-2 rounded bg-transparent text-lg"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
            disabled={pubkey === ""}
            onClick={async () => {
              if (!privateKey) return;
              setError("");

              try {
                // encrypt message
                const encryptedMessage = await encryptMessage({
                  message: messageInput.current?.value ?? "",
                  receviersPublicKey: await importPublicKey(pubkey),
                  privateKey,
                });
                setCiphertext(encryptedMessage);
              } catch (e) {
                console.log("Encrypt error: ", e);
                setError((e as Error).message);
              }
            }}
          >
            Encrypt
          </Button>
        </div>
        <div className="relative w-full flex flex-col items-center gap-4 mt-8">
          <div className="flex flex-col gap-2 w-full">
            <h3 className="block text-2xl">Ciphertext</h3>
            <pre className="w-full min-h-24 border border-gray-300 px-3 py-2 rounded bg-transparent text-lg overflow-x-auto">
              {ciphertext}
            </pre>
            <Button
              variant="outline"
              className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
              onClick={() => navigator.clipboard.writeText(ciphertext)}
              disabled={!ciphertext}
            >
              Copy Ciphertext
            </Button>
          </div>
        </div>
      </>
    );
  };

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
              <h1>{encryptionMode ? "Encrypt message" : "Decrypt message"}</h1>
            </Label>
          </div>
          {error ? <p className="text-red-400">Error: {error}</p> : <></>}
        </div>
        {encryptionMode ? <EncryptMessage /> : <DecryptMessage />}
      </div>
    </div>
  );
};
