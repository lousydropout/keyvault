import { CREDENTIALS, ENCRYPTEDS, MODIFIED } from "@/constants/hookVariables";
import { ASTAR, LOCALHOST } from "@/constants/networks";
import { useChromeStoreLocal } from "@/hooks/useChromeStore";
import { Cred } from "@/utils/credentials";
import { Encrypted } from "@/utils/encryption";
import { astar, hardhat } from "viem/chains";

// Modify the NETWORK constant to the desired chain here
export const NETWORK: typeof LOCALHOST | typeof ASTAR =
  import.meta.env.VITE_NETWORK === ASTAR ? ASTAR : LOCALHOST;

export const useChainId = (): {
  chainId: number;
  toggleChain: () => void;
  modified: boolean;
  setModified: (modified: boolean) => void;
} => {
  const [chainId, setChainId] = useChromeStoreLocal<number>(
    "chainId",
    NETWORK === LOCALHOST ? hardhat.id : astar.id
  );
  const [_creds, setCreds] = useChromeStoreLocal<Cred[]>(CREDENTIALS, []);
  const [_encrypteds, setEncrypteds] = useChromeStoreLocal<Encrypted[]>(
    ENCRYPTEDS,
    []
  );
  const [modified, setModified] = useChromeStoreLocal<boolean>(MODIFIED, false);

  const toggleChain = () => {
    setChainId(chainId === hardhat.id ? astar.id : hardhat.id);
    setCreds([]);
    setEncrypteds([]);
    setModified(true);
  };
  return { chainId, toggleChain, modified, setModified };
};
