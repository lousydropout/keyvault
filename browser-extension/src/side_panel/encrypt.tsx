import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPublicKey } from "@/utils/getPublicKey";
import { encryptMessage, importPublicKey } from "@/utils/openpgp";
import { PrivateKey } from "openpgp";

import { useRef, useState } from "react";
import { Hex } from "viem";

export const EncryptMessage = ({ privateKey }: { privateKey: PrivateKey }) => {
  const publicKeyInput = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const [ciphertext, setCiphertext] = useState<string>("");
  const [error, setError] = useState<string>("");

  console.log("[EncryptMessage] rendering");
  return (
    <>
      {error ? (
        <p className="text-red-400 my-4 text-lg">Error: {error}</p>
      ) : (
        <></>
      )}

      <div className="relative w-full flex flex-col items-center gap-4">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="description" className="block text-xl">
            Recipient's address
          </Label>
          <Input
            ref={publicKeyInput}
            placeholder="Enter recipient's address"
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
          onClick={async () => {
            if (!privateKey) return;
            setError("");

            let _pubkey;
            try {
              const _publicKey = publicKeyInput.current?.value ?? "";
              _pubkey = await getPublicKey(_publicKey as Hex);
            } catch (e) {
              setError("Failed to retrieve sender's pubkey");
              return;
            }
            console.log("pubkey: ", _pubkey);

            try {
              // encrypt message
              const encryptedMessage = await encryptMessage({
                message: messageInput.current?.value ?? "",
                receviersPublicKey: await importPublicKey(_pubkey),
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
