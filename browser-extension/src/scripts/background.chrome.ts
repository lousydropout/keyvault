import {
  ACCOUNT_CREATED,
  FROM_EXTENSION,
  INITIALIZATION,
  TO_EXTENSION,
} from "@/scripts/constants";
import { logger } from "@/utils/logger";

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
    logger.debug("[background] Message received: ", message);

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

          // Send the selected credentials to the content script with complete message structure
          const tabId = sender.tab?.id ?? -1;
          if (tabId !== -1) {
            chrome.tabs.sendMessage(tabId, {
              type: "FROM_EXTENSION",
              action: "fillCredentials",
              username,
              password,
            }).catch((error) => {
              // Handle cases where tab is closed, content script not loaded, or page doesn't support messaging
              // This is expected behavior for certain pages (chrome://, extension pages, etc.)
              // and pages without form fields, so we silently ignore it
              const errorMessage = error?.message || String(error);
              if (errorMessage.includes("Receiving end does not exist") || 
                  errorMessage.includes("Could not establish connection")) {
                // Expected case - content script not available on this page
                logger.debug("[background] Content script not available on this page (expected for some pages)");
              } else {
                // Unexpected error - log for debugging
                logger.debug("[background] Failed to send fillCredentials message:", error);
              }
            });
          }
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
  .catch((error) => logger.error(error));

// Autofill tests
chrome.runtime.onInstalled.addListener(() => {
  logger.info("Extension installed");
});
