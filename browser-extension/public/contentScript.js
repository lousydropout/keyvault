// receives messages from popup/sidepanel
chrome.runtime.onMessage.addListener((msg) => {
  // console.log("[contentScript] Message received: ", msg);

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

// let i = 0;
// setInterval(() => {
//   console.log("Hello from contentScript.js: ", i++);
// }, 1000);
// console.log("contentScript.js loaded");

// Listen for the credentials sent by the background script
function handleMessage(message) {
  const usernameField = document.querySelector(
    'input[type="text"], input[type="email"]'
  );
  const passwordField = document.querySelector('input[type="password"]');

  if (usernameField) usernameField.value = message.username;
  if (passwordField) passwordField.value = message.password;
}

// Add the event listener
chrome.runtime.onMessage.addListener(handleMessage);

// Remove the listener when the page is unloaded
window.addEventListener("unload", () => {
  chrome.runtime.onMessage.removeListener(handleMessage);
});
