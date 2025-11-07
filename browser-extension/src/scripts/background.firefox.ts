import {
  ACCOUNT_CREATED,
  FROM_EXTENSION,
  INITIALIZATION,
  TO_EXTENSION,
} from "@/scripts/constants";
import browser, { Runtime, windows } from "webextension-polyfill";
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

// Listener for messages from content scripts or popups
const messageListener = (
  message: unknown,
  sender: Runtime.MessageSender,
  sendResponse: (response: unknown) => void
) => {
  logger.debug("[background] Message received: ", message);

  // Type assertion to extract the actual message
  const msg = message as Message;

  // Ignore specific origins or sources
  if (
    msg.origin === "koni-page" ||
    msg.origin === "koni-content" ||
    msg.source === "react-devtools-content-script" ||
    msg.source === "react-devtools-bridge"
  ) {
    return true; // Indicate message was handled but no response needed
  }

  logger.debug("[background] Message received: ", msg);

  if (!msg.type) msg.type = null;

  switch (msg.type) {
    case ACCOUNT_CREATED:
      browser.storage.local.set({ walletAddress: msg.address });
      break;

    case TO_EXTENSION:
      browser.storage.local.set({
        [msg.key!]: JSON.stringify(msg.value), // Use `!` if you're sure key is defined
      });
      break;

    case INITIALIZATION:
      browser.storage.local.set({ [msg.key!]: INITIALIZATION });
      break;

    case FROM_EXTENSION:
      const message = msg as Message; // Type assertion
      if (message.action === "fillCredentials") {
        const { username, password } = message;

        // Send the selected credentials to the content script with complete message structure
        if (sender.tab?.id !== undefined) {
          browser.tabs.sendMessage(sender.tab.id, {
            type: "FROM_EXTENSION",
            action: "fillCredentials",
            username,
            password,
          }).catch((error) => {
            // Handle cases where tab is closed or content script not loaded
            logger.debug("[background] Failed to send fillCredentials message:", error);
          });
        }
      }
      break;

    default:
      break;
  }

  // Return true to indicate we'll respond asynchronously via sendResponse
  sendResponse({ acknowledged: true }); // Responds with acknowledgment
  return true; // Indicate async response handling
};

// Adding the message listener
browser.runtime.onMessage.addListener(messageListener as any);

// Allows users to open the sidebar (Firefox)
browser.sidebarAction
  .setPanel({ panel: "side_panel/index.html" }) // Set your Firefox sidebar panel here
  .catch((error) => logger.error(error));

// Autofill tests
browser.runtime.onInstalled.addListener(() => {
  logger.info("Extension installed");
});

// Listener for the extension icon click
browser.pageAction.onClicked.addListener(async () => {
  if (
    await browser.sidebarAction.isOpen({ windowId: windows.WINDOW_ID_CURRENT })
  ) {
    // Close the sidebar
    browser.sidebarAction.close();
  } else {
    // Open the sidebar
    browser.sidebarAction.open();
  }
});
