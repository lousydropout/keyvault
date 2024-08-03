export const getHostname = (
  currentTab: string | chrome.tabs.Tab | undefined
): string | null => {
  if (currentTab === undefined) return null;

  if (typeof currentTab === "string") {
    try {
      const urlParts = new URL(currentTab);
      const hostname = urlParts.hostname;
      const parts = hostname.split(".");
      if (parts.length > 2) {
        return parts.slice(1).join(".");
      }
      return hostname;
    } catch (e) {
      console.debug("Unable to read current tab's url: ", e);
    }
  } else if (currentTab?.url) {
    try {
      const urlParts = new URL(currentTab.url);
      const hostname = urlParts.hostname;
      const parts = hostname.split(".");
      if (parts.length > 2) {
        return parts.slice(1).join(".");
      }
      return hostname;
    } catch (e) {
      console.debug("Unable to read current tab's url: ", e);
    }
  }
  return null;
};
