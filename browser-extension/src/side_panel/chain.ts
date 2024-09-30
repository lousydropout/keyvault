import { CREDENTIALS, ENCRYPTEDS, MODIFIED } from "@/constants/hookVariables";
import { ASTAR, LOCALHOST } from "@/constants/networks";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
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
  const [chainId, setChainId] = useBrowserStoreLocal<number>(
    "chainId",
    NETWORK === LOCALHOST ? hardhat.id : astar.id
  );
  const [_creds, setCreds] = useBrowserStoreLocal<Cred[]>(CREDENTIALS, []);
  const [_encrypteds, setEncrypteds] = useBrowserStoreLocal<Encrypted[]>(
    ENCRYPTEDS,
    []
  );
  const [modified, setModified] = useBrowserStoreLocal<boolean>(
    MODIFIED,
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
