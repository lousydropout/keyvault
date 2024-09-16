import { View } from "@/components/header";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useChromeStore, useChromeStoreLocal } from "@/hooks/useChromeStore";
import { CredentialsAll } from "@/side_panel/credentialsAll";
import { CurrentPage } from "@/side_panel/currentPage";
import { Cred, CredsByUrl, getCredsByUrl } from "@/utils/credentials";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

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
  const [creds] = useChromeStoreLocal<Cred[]>("credentials", []);
  const [credsUrl, setCredsUrl] = useState<CredsByUrl>({});

  const [seeAll, setSeeAll] = useState<boolean>(true);
  const toggleSeeAll = () => setSeeAll((prev) => !prev);

  useEffect(() => {
    if (!creds) return;

    console.log("[credentials] creds: ", creds);

    setCredsUrl(getCredsByUrl(creds));
  }, [creds]);

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
          <Refresh className="absolute right-0 w-6 h-6 cursor-pointer hover:text-purple-300 active:text-purple-400" />
        </div>
      </div>
      {seeAll ? (
        <CredentialsAll credsUrl={credsUrl} />
      ) : (
        <CurrentPage credsUrl={credsUrl} />
      )}
    </div>
  );
};
