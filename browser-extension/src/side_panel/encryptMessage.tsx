import { View } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CREDENTIALS, VIEW } from "@/constants/hookVariables";
import { useBrowserStore, useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { Cred, isKeypairCred } from "@/utils/credentials";
import {
  ArmoredKey,
  decryptMessage,
  encryptMessage,
  importPrivateKey,
  importPublicKey,
} from "@/utils/openpgp";

import { useEffect, useRef, useState } from "react";

export const EncryptMessage = () => {
  const [creds] = useBrowserStoreLocal<Cred[]>(CREDENTIALS, []);
  const [_view, setView] = useBrowserStore<View>(VIEW, "New Credential");

  const [privateKey, setPrivateKey] = useState<ArmoredKey>({
    body: "",
    crc: "",
  });
  const [encryptionMode, setEncryptionMode] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!creds) return;

    for (const cred of [...creds].reverse()) {
      if (isKeypairCred(cred)) {
        setPrivateKey(cred.privateKey);
        break;
      }
    }
  }, [creds]);

  const DecryptMessage = () => {
    const [message, setMessage] = useState<string>("");
    const publicKeyInput = useRef<HTMLTextAreaElement>(null);
    const ciphertextInput = useRef<HTMLTextAreaElement>(null);

    return (
      <>
        <div className="relative w-full flex flex-col items-center gap-4">
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="description" className="block text-xl">
              Sender's public key
            </Label>
            <Textarea
              ref={publicKeyInput}
              placeholder="Enter recipient's public key"
              className="w-full border border-gray-300 px-3 py-2 rounded bg-transparent text-lg text-nowrap"
            />
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
          {error ? <p className="text-red-400">{error}</p> : <></>}
          <Button
            type="submit"
            variant="outline"
            className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
            disabled={!ciphertextInput.current?.value}
            onClick={async () => {
              // encrypt message
              const _ciphertext = ciphertextInput.current?.value ?? "";
              const { isValid, plaintext, signedBy } = await decryptMessage({
                ciphertext: _ciphertext,
                sendersPublicKey: await importPublicKey(
                  publicKeyInput.current?.value ?? ""
                ),
                privateKey: await importPrivateKey(privateKey),
              });

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
            >
              Copy message
            </Button>
          </div>
        </div>
      </>
    );
  };

  const EncryptMessage = () => {
    const publicKeyInput = useRef<HTMLTextAreaElement>(null);
    const messageInput = useRef<HTMLTextAreaElement>(null);
    const [ciphertext, setCiphertext] = useState<string>("");

    return (
      <>
        <div className="relative w-full flex flex-col items-center gap-4">
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="description" className="block text-xl">
              Recipient's public key
            </Label>
            <Textarea
              ref={publicKeyInput}
              placeholder="Enter recipient's public key"
              className="w-full border border-gray-300 px-3 py-2 rounded bg-transparent text-lg text-nowrap"
            />
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
            disabled={
              !messageInput.current?.value || !publicKeyInput.current?.value
            }
            onClick={async () => {
              // encrypt message
              const _publicKey = publicKeyInput.current?.value ?? "";
              const encryptedMessage = await encryptMessage({
                message: messageInput.current?.value ?? "",
                receviersPublicKey: await importPublicKey(_publicKey),
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
            <pre className="w-full min-h-24 border border-gray-300 px-3 py-2 rounded bg-transparent text-lg overflow-x-auto">
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
        </div>
        {encryptionMode ? <EncryptMessage /> : <DecryptMessage />}
      </div>
    </div>
  );
};
