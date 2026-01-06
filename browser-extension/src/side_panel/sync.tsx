import { MultiChainSync } from "@/components/MultiChainSync";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { ENCRYPTEDS, PENDING_CREDS } from "@/constants/hookVariables";
import { Encrypted } from "@/utils/encryption";
import { Cred } from "@/utils/credentials";

type SyncProps = {
  cryptoKey: CryptoKey | null;
};

/**
 * Sync page component.
 *
 * Displays per-chain sync status for all enabled chains.
 * Users can sync credentials to chains that are behind.
 * Localhost is hidden when devMode is off.
 */
export const Sync = ({ cryptoKey }: SyncProps) => {
  const [encrypteds] = useBrowserStoreLocal<Encrypted[]>(ENCRYPTEDS, []);
  const [pendingCreds] = useBrowserStoreLocal<Cred[]>(PENDING_CREDS, []);
  const [devMode] = useBrowserStoreLocal<boolean>("devMode", false);

  return (
    <MultiChainSync
      sourceEncrypteds={encrypteds}
      devMode={devMode}
      pendingCreds={pendingCreds}
      cryptoKey={cryptoKey}
    />
  );
};
