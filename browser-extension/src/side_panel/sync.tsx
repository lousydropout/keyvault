import { MultiChainSync } from "@/components/MultiChainSync";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { ENCRYPTEDS } from "@/constants/hookVariables";
import { Encrypted } from "@/utils/encryption";

/**
 * Sync page component.
 *
 * Displays per-chain sync status for all enabled chains.
 * Users can sync credentials to chains that are behind.
 */
export const Sync = () => {
  const [encrypteds] = useBrowserStoreLocal<Encrypted[]>(ENCRYPTEDS, []);

  return <MultiChainSync sourceEncrypteds={encrypteds} />;
};
