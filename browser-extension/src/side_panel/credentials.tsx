import { Icon } from "@/components/icon";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    CREDS_BY_URL,
    NUM_ENTRIES,
    PENDING_CREDS,
    PUBKEY,
} from "@/constants/hookVariables";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useChain } from "@/side_panel/chain";
import { CredentialsAll } from "@/side_panel/credentialsAll";
import { CurrentPage } from "@/side_panel/currentPage";
import {
    Cred,
    CredsByUrl,
    getCredsByUrl,
    mergeCredsByUrl,
} from "@/utils/credentials";
import { getNumEntries } from "@/utils/getNumEntries";
import { logger } from "@/utils/logger";
import { useMemo, useState } from "react";
import { Hex } from "viem";

const Refresh = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

export const Credentials = () => {
  const [credsUrl] = useBrowserStoreLocal<CredsByUrl>(CREDS_BY_URL, {});
  const [pendingCreds] = useBrowserStoreLocal<Cred[]>(PENDING_CREDS, []);
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");
  const [numEntries, setNumEntries] = useBrowserStoreLocal<number>(
    NUM_ENTRIES,
    -1
  );
  const { chainId } = useChain();

  // Merge synced credentials (credsUrl) with unsynced credentials (pendingCreds)
  const mergedCredsUrl = useMemo(() => {
    const unsyncedCredsByUrl = getCredsByUrl(pendingCreds);
    return mergeCredsByUrl(credsUrl, unsyncedCredsByUrl);
  }, [credsUrl, pendingCreds]);

  const [seeAll, setSeeAll] = useState<boolean>(true);
  const toggleSeeAll = () => setSeeAll((prev: boolean) => !prev);

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl mb-4">Credentials</h1>
        <div className="relative w-full flex items-center">
          <div className="mt-2 self-end flex items-center space-x-2 cursor-pointer">
            <Switch
              id="see-all-mode"
              checked={seeAll}
              onCheckedChange={toggleSeeAll}
              className="border-purple-200"
            />
            <Label htmlFor="see-all-mode">
              {seeAll ? "All" : "Current Page"}
            </Label>
          </div>
          <Icon
            onClick={() => {
              getNumEntries(pubkey as Hex, chainId).then((num) => {
                if (num && num !== numEntries) setNumEntries(num || numEntries);
                logger.debug("[Credentials] Refreshing... nums = ", {
                  num,
                  numEntries,
                });
              });
            }}
          >
            <Refresh className="absolute right-0 w-6 h-6 cursor-pointer hover:text-purple-300 active:text-purple-400" />
          </Icon>
        </div>
      </div>
      {seeAll ? (
        <CredentialsAll credsUrl={mergedCredsUrl} />
      ) : (
        <CurrentPage credsUrl={mergedCredsUrl} />
      )}
    </div>
  );
};
