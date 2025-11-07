// Inject CSS style for visual feedback (only once)
let styleInjected = false;
function injectVisualFeedbackStyle() {
  if (styleInjected) return;
  const style = document.createElement("style");
  style.textContent = `.keyvault-filled { outline: 2px solid #22c55e; transition: outline 0.3s ease; }`;
  document.head.appendChild(style);
  styleInjected = true;
}

// Set field value using native setter to bypass React's shadowed value property
function setFieldValue(field, value) {
  try {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(field, value);
    } else {
      // Fallback if native setter not available
      field.value = value;
    }
    
    // Dispatch events for framework detection (React/Angular/Vue)
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  } catch (error) {
    console.debug("[keyvault] Error setting field value:", error);
    // Fallback to simple assignment
    field.value = value;
  }
}

// Add visual feedback to filled field
function addVisualFeedback(field) {
  injectVisualFeedbackStyle();
  field.classList.add("keyvault-filled");
  setTimeout(() => {
    field.classList.remove("keyvault-filled");
  }, 800);
}

// Find username field with priority: autocomplete attributes > type selectors > name patterns
function findUsernameField() {
  // Priority 1: autocomplete attributes
  let field = document.querySelector('input[autocomplete="username"]');
  if (field) return field;
  
  field = document.querySelector('input[autocomplete="email"]');
  if (field) return field;
  
  // Priority 2: type selectors
  field = document.querySelector('input[type="email"]');
  if (field) return field;
  
  field = document.querySelector('input[type="text"]');
  if (field) return field;
  
  // Priority 3: name patterns (fallback) - case insensitive
  const namePatterns = ["username", "user", "email", "login", "account"];
  for (const pattern of namePatterns) {
    // Try exact match first
    field = document.querySelector(`input[name="${pattern}"]`);
    if (field) return field;
    // Try lowercase
    field = document.querySelector(`input[name="${pattern.toLowerCase()}"]`);
    if (field) return field;
    // Try uppercase
    field = document.querySelector(`input[name="${pattern.toUpperCase()}"]`);
    if (field) return field;
  }
  
  return null;
}

// Find password field with priority: autocomplete attributes > type selectors > name patterns
function findPasswordField() {
  // Priority 1: autocomplete attributes
  let field = document.querySelector('input[autocomplete="current-password"]');
  if (field) return field;
  
  field = document.querySelector('input[autocomplete="new-password"]');
  if (field) return field;
  
  // Priority 2: type selector
  field = document.querySelector('input[type="password"]');
  if (field) return field;
  
  // Priority 3: name patterns (fallback)
  const pwSpellings = ["Passwd", "password", "Password", "passwd", "pw"];
  for (const spelling of pwSpellings) {
    field = document.querySelector(`input[type="text"][name="${spelling}"]`);
    if (field) return field;
  }
  
  return null;
}

// Fill credentials into form fields
async function fillCredentials(username, password) {
  try {
    // Try to use Credential Management API (only works on secure origins)
    try {
      if (navigator.credentials && navigator.credentials.store) {
        await navigator.credentials.store(
          new PasswordCredential({
            id: username,
            password: password,
          })
        );
      }
    } catch (credError) {
      // Silently fail - API only works on secure origins (https)
      // Not available on localhost or file:// URLs
      // Often requires user gesture - don't rely on it for critical persistence
      console.debug("[keyvault] Credential Management API not available:", credError);
    }

    // Find and fill username field
    const usernameField = findUsernameField();
    if (usernameField) {
      usernameField.focus();
      setFieldValue(usernameField, username);
      addVisualFeedback(usernameField);
    }

    // Find and fill password field
    const passwordField = findPasswordField();
    if (passwordField) {
      passwordField.focus();
      setFieldValue(passwordField, password);
      addVisualFeedback(passwordField);
    }

    // Log success (without credentials)
    if (usernameField || passwordField) {
      console.debug("[keyvault] Credentials filled successfully");
    } else {
      console.debug("[keyvault] No matching form fields found");
    }
  } catch (error) {
    console.debug("[keyvault] Error filling credentials:", error);
  }
}

// Handle fill credentials message
function handlefillCredential(message) {
  if (!message.username || !message.password) {
    console.debug("[keyvault] Missing username or password in message");
    return;
  }
  
  fillCredentials(message.username, message.password);
}

// Handle messages from background script
function handleMessage(msg, sender, sendResponse) {
  // Parse message if needed
  let message;
  try {
    message = typeof msg === "string" ? JSON.parse(msg) : msg;
  } catch (e) {
    message = msg;
  }

  // Only process messages from extension
  if (message.type !== "FROM_EXTENSION") {
    return;
  }

  if (message.action === "fillCredentials") {
    handlefillCredential(message);
  } else if ("data" in message) {
    window.postMessage(message);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(handleMessage);

// Remove the listener when the page is unloaded
window.addEventListener("unload", () => {
  chrome.runtime.onMessage.removeListener(handleMessage);
});
