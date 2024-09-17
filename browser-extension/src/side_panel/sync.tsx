import { Button } from "@/components/ui/button";
import { chain } from "@/config";
import { useCurrentTab } from "@/hooks/useCurrentTab";

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

  console.log(`Forwarding the following data to tabId: ${tabId}`, data);
  chrome.tabs.sendMessage(tabId, { type: "FROM_EXTENSION", data });
};

export const Sync = () => {
  const [tab] = useCurrentTab();
  const tabId = tab?.id || chrome.tabs.TAB_ID_NONE;

  return (
    <div className="flex flex-col items-center justify-start gap-2 p-4">
      <h1 className="mb-16 text-4xl">Sync</h1>
      <Button
        variant="outline"
        className="w-fit bg-purple-500 hover:bg-purple-600 active:bg-purple-800 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
        onClick={() => sendData(tabId)}
      >
        Send data to dApp
      </Button>
    </div>
  );
};
