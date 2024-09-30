import {
  ACCOUNT_CREATED,
  FROM_EXTENSION,
  INITIALIZATION,
  TO_EXTENSION,
} from "@/scripts/constants";

// Define the message structure
type Message = {
  origin?: string;
  source?: string;
  type?: string | null;
  address?: string;
  key?: string;
  value?: any;
  action?: string;
  username?: string;
  password?: string;
};

chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (
      message.origin === "koni-page" ||
      message.origin === "koni-content" ||
      message.source === "react-devtools-content-script" ||
      message.source === "react-devtools-bridge"
    )
      return false;
    console.debug("[background] Message received: ", message);

    if (!message.type) message.type = null;

    switch (message.type) {
      case ACCOUNT_CREATED:
        chrome.storage.local.set({ walletAddress: message.address });
        break;

      case TO_EXTENSION:
        chrome.storage.local.set({
          [message.key ?? "missing"]: JSON.stringify(message.value),
        });
        break;

      case INITIALIZATION:
        chrome.storage.local.set({
          [message.key ?? "missing"]: INITIALIZATION,
        });
        break;

      case FROM_EXTENSION:
        if (message.action === "fillCredentials") {
          const { username, password } = message;

          // Send the selected credentials to the content script
          chrome.tabs.sendMessage(sender.tab?.id ?? -1, { username, password });
        }
        break;

      default:
        break;
    }

    // Record address to chrome.storage.local
    sendResponse({ acknowledged: true });
    return false; // Close asynchronous response for messaging channel
  }
);

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true }) // set to `false` to allow regular popups
  .catch((error) => console.error(error));

// Autofill tests
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});
