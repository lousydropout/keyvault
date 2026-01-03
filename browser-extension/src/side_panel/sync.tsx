import { MultiChainSync } from "@/components/MultiChainSync";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { ENCRYPTEDS } from "@/constants/hookVariables";
import { Encrypted } from "@/utils/encryption";

/**
 * Sync page component.
 *
 * Displays per-chain sync status for all enabled chains.
 * Users can sync credentials to chains that are behind.
 * Localhost is hidden when devMode is off.
 */
export const Sync = () => {
  const [encrypteds] = useBrowserStoreLocal<Encrypted[]>(ENCRYPTEDS, []);
  const [devMode] = useBrowserStoreLocal<boolean>("devMode", false);

  return <MultiChainSync sourceEncrypteds={encrypteds} devMode={devMode} />;
};
