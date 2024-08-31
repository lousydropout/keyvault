import { Button } from "@/components/ui/button";
import { chain } from "@/config";
import { useCurrentTab } from "@/hooks/useCurrentTab";
import { useState } from "react";

const sendData = async (tabId: number) => {
  // message does not contain any unencrypted or sensitive data
  const data = await chrome.storage.local.get([
    "encrypteds",
    "pubkey",
    "numEntries",
  ]);
  data.encrypteds = JSON.parse(data.encrypteds);
  data.address = JSON.parse(data.pubkey);
  delete data.pubkey;
  data.numEntries = Number.parseInt(data.numEntries);
  data.overwrite = true;
  data.chainId = chain.id;

  console.log("Forwarding the following data to app: ", data);
  chrome.tabs.sendMessage(tabId, {
    type: "FROM_EXTENSION",
    data,
  });
};

export const Sync = () => {
  const [tab, tabHostname] = useCurrentTab();
  const [sent, setSent] = useState<boolean>(false);
  console.log({ tab, tabHostname });

  const tabId = tab?.id || chrome.tabs.TAB_ID_NONE;

  return (
    <div className="flex flex-col gap-2">
      <h1 className="mt-8 mb-4 text-center text-lg">Sync</h1>
      <Button variant="default" onClick={() => sendData(tabId)}>
        Send data to webapp
      </Button>
      {/* <Button
        onClick={() => {
          chrome.tabs.sendMessage(tab?.id || chrome.tabs.TAB_ID_NONE, {
            type: "FROM_EXTENSION",
            action: "fillCredentials",
            username: "JohnDoe123",
            password: "password1234321",
          });
        }}
      >
        Sync
      </Button> */}
    </div>
  );
};
