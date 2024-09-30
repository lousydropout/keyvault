import { FROM_EXTENSION } from "@/scripts/constants";
import { handlefillCredential } from "@/scripts/contentScriptShared";
import { ContentScriptMessage, isContentScriptMessage } from "@/scripts/types";

const handleMessageChrome = (msg: string | ContentScriptMessage) => {
  // get message
  let message: ContentScriptMessage;
  try {
    message = JSON.parse(msg as string);
  } catch (e) {
    message = msg as ContentScriptMessage;
  }

  if (!isContentScriptMessage(message)) return;

  // forward message
  if (message.type !== FROM_EXTENSION) return;

  if (message.action === "fillCredentials") {
    console.log("[contentScript] handlefillCredentialChrome: ", message);
    if (message.username && message.password) {
      handlefillCredential(
        message as ContentScriptMessage & { username: string; password: string }
      );
    }
  } else if ("data" in message) {
    console.log("[contentScript] postMessage: ", message);
    window.postMessage(message);
  }
};

// receives messages from popup/sidepanel
chrome.runtime.onMessage.addListener(handleMessageChrome);

// Remove the listener when the page is unloaded
window.addEventListener("unload", () => {
  chrome.runtime.onMessage.removeListener(handleMessageChrome);
});
