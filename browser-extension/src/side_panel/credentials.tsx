import { View } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useChromeStorageLocal } from "@/hooks/useChromeLocalStorage";
import { Cred } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { Dispatch, SetStateAction } from "react";

export const Credentials = ({
  setView,
}: {
  setView: Dispatch<SetStateAction<View>>;
}) => {
  const [pubkey, setPubkey] = useChromeStorageLocal<string>("pubkey", "");
  const [numOnChain, setNumOnChain] = useChromeStorageLocal<number>(
    "numEntries",
    -1
  );
  const [encrypteds, setEncrypteds] = useChromeStorageLocal<Encrypted[]>(
    `encrypteds`,
    []
  );
  const [creds, setCreds] = useChromeStorageLocal<Cred[]>("credentials", []);

  return (
    <div className="flex flex-col gap-4 px-2 py-4">
      <h1 className="text-4xl text-center">Dashboard</h1>
      <Button onClick={() => setView("Current Page")}>See current page</Button>
      <h2>{pubkey}</h2>
      <h3>numOnChain: {numOnChain}</h3>
    </div>
  );
};
