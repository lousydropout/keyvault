const handlefillCredential = (message) => {
  let selector;

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

function handleMessage(msg) {
  // get message
  let message;
  try {
    message = JSON.parse(msg);
  } catch (e) {
    message = msg;
  }

  // forward message
  if (message.type !== "FROM_EXTENSION") return;

  if (message.action === "fillCredentials") {
    if (message.username && message.password) {
      handlefillCredential(message);
    }
  } else if ("data" in message) {
    window.postMessage(message);
  }
}

// receives messages from popup/sidepanel
chrome.runtime.onMessage.addListener(handleMessage);

// Remove the listener when the page is unloaded
window.addEventListener("unload", () => {
  chrome.runtime.onMessage.removeListener(handleMessage);
});
