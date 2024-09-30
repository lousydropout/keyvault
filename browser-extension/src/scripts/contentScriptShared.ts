import { ContentScriptMessage } from "@/scripts/types";

// Listen for the credentials sent by the background script
export const handlefillCredential = (
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
