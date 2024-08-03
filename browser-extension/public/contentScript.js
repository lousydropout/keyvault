const LOCALHOST = "localhost";
const WEB_DAPP = "app.blockchainkeyvault.com";

window.addEventListener("message", (event) => {
  // Fetch the targetOrigin each time a message is received
  chrome.storage.local.get("targetOrigin", (data) => {
    // Use the retrieved targetOrigin if it exists, otherwise default to "localhost"
    const targetOrigin = data.targetOrigin || WEB_DAPP || LOCALHOST;
    // get origin's hostname
    const origin = new URL(event.origin).hostname;

    // Check if the message's origin matches the targetOrigin
    if (origin !== targetOrigin) {
      return;
    }

    // Check if the message type is REQUEST_TAB_ID
    if (event.data.type === "REQUEST_TAB_ID") {
      // Retrieve the sender tab's ID
      const senderTabId = chrome.devtools.inspectedWindow.tabId;

      // Send a message back to the sender tab with the tab ID
      window.postMessage(
        { type: "RESPONSE_TAB_ID", tabId: senderTabId },
        targetOrigin
      );
    } else {
      // Forward message
      chrome.runtime.sendMessage(event.data).catch((e) => {
        console.log("[warning] potential sendMessage failure: ", e);
      });
    }
  });
});

// receives messages from popup/sidepanel
chrome.runtime.onMessage.addListener((msg) => {
  // get message
  let message;
  try {
    message = JSON.parse(msg);
  } catch (e) {
    message = msg;
  }

  // forward message
  if (message.type === "FROM_EXTENSION") {
    window.postMessage(message);
  }
});

// Inject data from chrome.storage.local
chrome.storage.local.get(
  ["encrypted", "numOnChain"],
  ({ encrypted, numOnChain }) => {
    window.sessionStorage.setItem("encrypted", encrypted || []);
    window.sessionStorage.setItem("numOnChain", numOnChain || 0);
  }
);
