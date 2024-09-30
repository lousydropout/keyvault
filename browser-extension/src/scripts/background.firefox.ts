import {
  ACCOUNT_CREATED,
  FROM_EXTENSION,
  INITIALIZATION,
  TO_EXTENSION,
} from "@/scripts/constants";
import browser, { Runtime, windows } from "webextension-polyfill";

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

// Type for the listener function
type MessageListener = (
  message: unknown,
  sender: Runtime.MessageSender,
  sendResponse: (response: unknown) => void
) => Promise<unknown> | true | undefined;

// Listener for messages from content scripts or popups
const messageListener: MessageListener = (message, sender, sendResponse) => {
  console.log("[background] Message received: ", message);

  // Type assertion to extract the actual message
  const msg = message as Message;

  // Ignore specific origins or sources
  if (
    msg.origin === "koni-page" ||
    msg.origin === "koni-content" ||
    msg.source === "react-devtools-content-script" ||
    msg.source === "react-devtools-bridge"
  ) {
    return undefined; // Do not respond to these messages
  }

  console.debug("[background] Message received: ", msg);

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

        // Send the selected credentials to the content script
        if (sender.tab?.id !== undefined) {
          browser.tabs.sendMessage(sender.tab.id, { username, password });
        }
      }
      break;

    default:
      break;
  }

  // Explicit return of a promise or undefined when using `sendResponse` with `browser.*`
  sendResponse({ acknowledged: true }); // Responds with acknowledgment
  return Promise.resolve(); // Ensures a promise is returned
};

// Adding the message listener
browser.runtime.onMessage.addListener(messageListener);

// Allows users to open the sidebar (Firefox)
browser.sidebarAction
  .setPanel({ panel: "side_panel/index.html" }) // Set your Firefox sidebar panel here
  .catch((error) => console.error(error));

// Autofill tests
browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
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
