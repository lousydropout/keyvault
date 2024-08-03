import { useState, useEffect } from "react";

// Assuming you have the types for chrome.storage,
// if not you might need to install @types/chrome or define them yourself
interface ChromeStorageSessionSet {
  [key: string]: any; // Changed from string to any to accommodate JSON parsing
}

function useChromeStorageSession<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    // Asynchronously get the stored value from chrome.storage.session
    chrome.storage.session.get([key], (result: ChromeStorageSessionSet) => {
      if (result[key] !== undefined) {
        try {
          setValue(JSON.parse(result[key]) as T);
        } catch (error) {
          console.debug("[Warning] Error parsing value from storage:", error);
          setValue(result[key] as unknown as T);
        }
      }
    });
  }, [key]);

  useEffect(() => {
    // Function to handle changes in chrome.storage.session
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "session" && changes[key]) {
        try {
          const newValue = changes[key].newValue;
          setValue(JSON.parse(newValue) as T);
        } catch (error) {
          console.debug(
            "[Warning] Error parsing updated value from storage:",
            error
          );
          setValue(changes[key].newValue as unknown as T);
        }
      }
    };

    // Listen for changes in storage
    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup the listener when the component unmounts or the key changes
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [key]);

  const setStoredValue: React.Dispatch<React.SetStateAction<T>> = (
    valueAction
  ) => {
    const valueToStore: T =
      valueAction instanceof Function ? valueAction(value) : valueAction;
    setValue(valueToStore);
    chrome.storage.session.set({ [key]: JSON.stringify(valueToStore) });
  };

  return [value, setStoredValue];
}

export { useChromeStorageSession };
