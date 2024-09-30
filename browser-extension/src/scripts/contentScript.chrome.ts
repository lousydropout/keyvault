type ContentScriptMessage = {
  type: string;
  action: string;
  username?: string;
  password?: string;
};

// Listen for the credentials sent by the background script
const handlefillCredential = (
  message: ContentScriptMessage & { username: string; password: string }
) => {
  let selector: string;

  // Fill in password
  const pwSpellings = ["Passwd", "password", "Password", "passwd", "pw"];
  let passwordField = document.querySelector('input[type="password"]');
  if (!passwordField)
    for (let j = 0; j < pwSpellings.length; j++) {
      selector = `input[type="text"][name="${pwSpellings[j]}"]`;
      passwordField = document.querySelector(selector);
      if (passwordField) break;
    }
  if (passwordField) {
    if ("value" in passwordField) passwordField.value = message.password;
    passwordField.setAttribute("data-initial-value", message.password);
    passwordField.setAttribute("value", message.password);
  }

  // Fill in username
  selector = 'input[type="text"], input[type="email"]';
  const usernameField = document.querySelector(selector);
  if (usernameField) {
    if ("value" in usernameField) usernameField.value = message.username;
    usernameField.setAttribute("data-initial-value", message.username);
    usernameField.setAttribute("value", message.username);
  }
};

const isContentScriptMessage = (obj: object): boolean => {
  return (
    "type" in obj &&
    typeof obj.type === "string" &&
    "action" in obj &&
    typeof obj.action === "string"
  );
};

function handleMessage(msg: string | ContentScriptMessage) {
  // get message
  let message: ContentScriptMessage;
  try {
    message = JSON.parse(msg as string);
  } catch (e) {
    message = msg as ContentScriptMessage;
  }

  if (!isContentScriptMessage(message)) return;

  // forward message
  if (message.type !== "FROM_EXTENSION") return;

  if (message.action === "fillCredentials") {
    console.log("[contentScript] handlefillCredential: ", message);
    if (message.username && message.password) {
      handlefillCredential(
        message as ContentScriptMessage & { username: string; password: string }
      );
    }
  } else if ("data" in message) {
    console.log("[contentScript] postMessage: ", message);
    window.postMessage(message);
  }
}

// receives messages from popup/sidepanel
chrome.runtime.onMessage.addListener(handleMessage);

// Remove the listener when the page is unloaded
window.addEventListener("unload", () => {
  chrome.runtime.onMessage.removeListener(handleMessage);
});
