# KeyVault Browser extension

## Installation

Requirements: I use `bun` and the `package.json` scripts assume you have `bun` installed. If you don't, please check out the [Bun installation page](https://bun.sh/docs/installation) for information on how to install `bun` on your computer.

Next, clone this repo and go into the `browser-extension` directory.

```bash
$ git clone git@github.com:lousydropout/keyvault.git
$ cd keyvault/browser-extension
```

Install the packages required for this project:

```bash
$ bun install
```

Test that your installation ran okay:

```bash
$ bun test
```

Finally, build the extension for Chromium/Brave and Firefox:

```bash
$ bun dev
```

This will create a `package/keyvault-firefox.zip` for Firefox and a `dist/` directory for Chromium/Brave.

For whatever reason(s), Firefox and Chromium-based browsers (i.e. Brave, Chrome, Chromium) expect different formats for their browser extensions. Firefox expects a `XPI` file for the Mozilla-approved version and a `zip` file otherwise (Developer edition). For Chromium-based browsers, you have to provide the path to the directory containing your extracted files.

## Loading the keyvault extension into Firefox Developer Edition

Note: "Mozilla requires all extensions to be signed by Mozilla in order for them to be installable in Release and Beta versions of Firefox." (see https://wiki.mozilla.org/Add-ons/Extension_Signing.) As far as I know, [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/) will work. So, at the current time, using `keyvault` will assume you have `Firefox Developer Edition` installed.

First, we need to disable requiring signatures for Add-ons.

1. On Firefox, go to [about:config](about:config),
2. type in `xpinstall.signatures.required` and set it to `false`.

Then, to install the add-on,

1. On Firefox, go to [about:addons](about:addons).
2. To the right of `Manage Your Extensions`, there is a Settings/Gear icon. Click on it.
3. Select `Install Add-on From File...` and select `keyvault/browser-extension/package/keyvault-firefox.zip`.

## Loading the keyvault extension into a Chromium browser (e.g. Chrome and Brave)

1. Go to [chrome://extensions/](chrome://extensions/)
2. Ensure that `Developer mode` is `enabled`.
3. Click on `Load unpacked` and select the `keyvault/browser-extension/dist/` directory.

## Process for transmitting data from React app to chrome extension side panel

### Process Overview

1. **React App Sends Data**: The React app sends data (e.g., ciphertext) to the extension's content script using `window.postMessage`. This is triggered by a user action, such as clicking a submit button.

   ```jsx
   // Inside the React app
   const sendData = (ciphertext) => {
     window.postMessage(
       { type: "FROM_PAGE", ciphertext },
       window.location.origin
     );
   };
   ```

2. **Content Script Receives Data**: The extension's content script listens for messages from the page. Upon receiving a message, it verifies the origin to ensure security, then sends the data to the background script or directly updates `chrome.storage.local`, depending on your architecture.

   ```javascript
   // Inside the content script
   window.addEventListener("message", (event) => {
     if (
       event.origin === window.location.origin &&
       event.data.type === "FROM_PAGE"
     ) {
       chrome.runtime.sendMessage({ ciphertext: event.data.ciphertext });
     }
   });
   ```

3. **Background Script / Storage Update**: The background script listens for messages from the content script and updates `chrome.storage.local` with the received data. Alternatively, the content script might update the storage directly.

   ```javascript
   // Inside the background script or content script
   chrome.runtime.onMessage.addListener((message) => {
     if (message.ciphertext) {
       chrome.storage.local.set({ ciphertext: message.ciphertext });
     }
   });
   ```

### Custom Hook for Side Panel

The `useChromeStore` custom hook abstracts interactions with `chrome.storage.local`, enabling components (like those in the side panel) to easily get and set stored values. It also listens for changes in storage to update the component state in real time.

- **Hook Definition**: The hook uses `useState` to manage local state, `useEffect` to fetch the initial value from storage, another `useEffect` to listen for storage changes, and a final `useEffect` to update storage when the state changes.

  ```typescript
  function useChromeStore<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(defaultValue);

    // Fetch initial value from storage
    // Listen for storage changes
    // Update storage when the state changes

    return [value, setValue];
  }
  ```

- **Real-Time Updates**: Includes logic to listen for changes in `chrome.storage.local` using `chrome.storage.onChanged.addListener`, ensuring that the component state reflects the latest stored values.

### Graceful Error Handling with Promises

When sending messages within the extension (e.g., from content script to background script or from the React app through a direct `chrome.runtime.sendMessage` call), use promise-based error handling to gracefully handle situations where the receiving end isn't available.

```javascript
chrome.runtime.sendMessage({ ciphertext }).catch((error) => {
  console.log(
    "Receiving end does not exist, message will be processed when available."
  );
});
```

### Putting It All Together

- The React app sends user input to the content script.
- The content script forwards this input to the background script or directly to storage.
- The side panel uses the `useChromeStore` hook to automatically fetch and display the stored data. The hook also ensures the side panel's state stays updated with any changes in storage, offering a reactive UI without manual refreshes.
- Error handling mechanisms are in place to ensure the extension behaves gracefully, even when parts of it are not active or available.

This process outlines a robust method for data transmission in a Chrome extension, leveraging modern React practices and Chrome's extension capabilities to create a seamless user experience.
