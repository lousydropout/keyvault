import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useChain } from "@/side_panel/chain";
import { logger } from "@/utils/logger";
import { getPublicKey } from "@/utils/getPublicKey";
import { decryptMessage, importPublicKey } from "@/utils/openpgp";
import { PrivateKey } from "openpgp";

import { useRef, useState } from "react";
import { Hex } from "viem";

export const DecryptMessage = ({ privateKey }: { privateKey: PrivateKey }) => {
  const { chainId } = useChain();
  const publicKeyInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string>("");
  const ciphertextInput = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string>("");

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
            Sender's address
          </Label>
          <Input
            ref={publicKeyInput}
            placeholder="Enter sender's address"
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
        <Button
          type="submit"
          variant="outline"
          className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
          onClick={async () => {
            if (!privateKey) return;
            setError("");

            let _pubkey;
            const _publicKey = publicKeyInput.current?.value ?? "";
            logger.debug("publicKey: ", _publicKey);
            try {
              _pubkey = await getPublicKey(_publicKey as Hex, chainId);
            } catch (e) {
              setError("Failed to retrieve recipient's pubkey");
              return;
            }
            logger.debug("pubkey: ", _pubkey);

            // decrypt message
            const _ciphertext = ciphertextInput.current?.value ?? "";
            try {
              const { isValid, plaintext, signedBy } = await decryptMessage({
                ciphertext: _ciphertext,
                sendersPublicKey: await importPublicKey(_pubkey),
                privateKey,
              });
              logger.debug("isValid: ", isValid, "signedBy: ", signedBy);

              if (!isValid) {
                if (signedBy === "missing signature") {
                  setError("Invalid signature");
                } else {
                  setError("Incorrect public key");
                }
              } else {
                setMessage(plaintext);
              }
            } catch (e) {
              logger.error("Decrypt error: ", e, (e as Error).message);
              setError("Unable to decrypt message");
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
