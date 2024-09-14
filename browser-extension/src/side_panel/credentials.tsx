import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useChromeStoreLocal } from "@/hooks/useChromeStore";
import { CredentialsAll } from "@/side_panel/credentialsAll";
import { CurrentPage } from "@/side_panel/currentPage";
import { Cred, CredsByUrl, getCredsByUrl } from "@/utils/credentials";
import { useEffect, useState } from "react";

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
        <h1 className="text-4xl">Credentials</h1>
        <div className="mt-2 self-end flex items-center space-x-2">
          <Label htmlFor="see-all-mode">
            {seeAll ? "All" : "Current Page"}
          </Label>
          <Switch
            id="see-all-mode"
            checked={seeAll}
            onCheckedChange={toggleSeeAll}
            className="border-purple-200"
          />
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
