import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChromeStorageLocal } from "@/hooks/useChromeLocalStorage";
import { SETUP_ENCRYPTION_KEY } from "@/side_panel/steps";
import { useState } from "react";
import { isAddress } from "viem/utils";

const isValidPublicKey = (publicKey: string): boolean => {
  return isAddress(publicKey, { strict: false });
};

type PubkeyRequestProps = {
  setStep: (step: number) => void;
};

export const PubkeyRequest = ({ setStep }: PubkeyRequestProps) => {
  const [pubkey, setPubkey] = useChromeStorageLocal<string>("pubkey", "");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSetPubkey = () => {
    setErrorMessage("");
    const elem = document.getElementById("pubkey") as HTMLInputElement;
    const pubkey = elem.value;

    if (isValidPublicKey(pubkey)) {
      setPubkey(pubkey);
    } else {
      setErrorMessage("Invalid public key");
    }
  };

  if (pubkey) {
    return (
      <div className="flex flex-col gap-4 px-2 py-4">
        <h1 className="text-4xl text-center">Welcome to keyvault!</h1>
        <h2 className="text-2xl mt-8">Thank you for entering your pubkey: </h2>
        <h4 className="text-sm">{pubkey}</h4>
        <div className="flex flex-row gap-4 justify-around">
          <Button className="border rounded-xl" onClick={() => setPubkey("")}>
            Cancel
          </Button>
          <Button
            className="border rounded-xl"
            onClick={() => setStep(SETUP_ENCRYPTION_KEY)}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-2 py-4">
      <h1 className="text-4xl text-center">Welcome to keyvault!</h1>
      <h2 className="text-2xl mt-8">
        To get started, please enter your pubkey:
      </h2>
      <h4 className="text-sm">{pubkey}</h4>
      <Input
        type="text"
        placeholder="0x..."
        id="pubkey"
        onKeyDown={(event) => {
          if (event.key === "Enter") handleSetPubkey();
        }}
      />
      <Button className="border rounded-xl" onClick={handleSetPubkey}>
        Confirm
      </Button>
      {errorMessage && <p className="text-red-800">{errorMessage}</p>}
    </div>
  );
};
