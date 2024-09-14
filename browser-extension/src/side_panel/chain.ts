import { useChromeStoreLocal } from "@/hooks/useChromeStore";
import { Cred } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { astar, hardhat } from "viem/chains";

// Modify the NETWORK constant to the desired chain here
export const NETWORK: "localhost" | "astar" =
  import.meta.env.VITE_NETWORK === "astar" ? "astar" : "localhost";

export const useChainId = (): {
  chainId: number;
  toggleChain: () => void;
  modified: boolean;
  setModified: (modified: boolean) => void;
} => {
  const [chainId, setChainId] = useChromeStoreLocal<number>(
    "chainId",
    NETWORK === "localhost" ? hardhat.id : astar.id
  );
  const [creds, setCreds] = useChromeStoreLocal<Cred[]>("credentials", []);
  const [_encrypteds, setEncrypteds] = useChromeStoreLocal<Encrypted[]>(
    "encrypteds",
    []
  );
  const [modified, setModified] = useChromeStoreLocal<boolean>(
    "modified",
    false
  );

  const toggleChain = () => {
    setChainId(chainId === hardhat.id ? astar.id : hardhat.id);
    setCreds([]);
    setEncrypteds([]);
    setModified(true);
  };
  return { chainId, toggleChain, modified, setModified };
};
