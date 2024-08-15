import { useEffect, useState } from "react";
import { getHostname } from "@/utils/getHostname";

export function useCurrentTab(): [chrome.tabs.Tab | undefined, string | null] {
  const [tab, setTab] = useState<chrome.tabs.Tab | undefined>(undefined);

  useEffect(() => {
    const updateUrl = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([currentTab]) =>
        setTab(currentTab)
      );
    };

    updateUrl();

    const onActivatedListener = () => updateUrl();
    const onUpdatedListener = (
      _tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ) => {
      if (changeInfo.url) updateUrl();
    };

    chrome.tabs.onActivated.addListener(onActivatedListener);
    chrome.tabs.onUpdated.addListener(onUpdatedListener);

    return () => {
      chrome.tabs.onActivated.removeListener(onActivatedListener);
      chrome.tabs.onUpdated.removeListener(onUpdatedListener);
    };
  }, []);

  return [tab, getHostname(tab)];
}
