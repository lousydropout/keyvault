const ACCOUNT_CREATED = "ACCOUNT_CREATED";
const TO_EXTENSION = "TO_EXTENSION";
const FROM_EXTENSION = "FROM_EXTENSION";
const INITIALIZATION = "INITIALIZATION";
const REQUEST = "REQUEST";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
        [message.key]: JSON.stringify(message.value),
      });
      break;

    case INITIALIZATION:
      chrome.storage.local.set({ [message.key]: INITIALIZATION });
      break;

    default:
      break;
  }
  // Record address to chrome.storage.local
  sendResponse({ acknowledged: true });
  return false; // Close asynchronous response for messaging channel
});

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true }) // set to `false` to allow regular popups
  .catch((error) => console.error(error));
