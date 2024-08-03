import { useState, useEffect } from "react";

interface ChromeStorageLocalSet {
  [key: string]: any; // To accommodate JSON parsing
}

// Define the function signature with generic type T for the return value.
function getFromChromeStorage<T>(key: string, defaultValue: T): Promise<T> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      if (result[key] !== undefined) {
        try {
          // Attempt to parse the stored JSON string back into an object of type T.
          const value: T = JSON.parse(result[key]);
          resolve(value);
        } catch (error) {
          console.error("[Warning] Error parsing value from storage:", error);
          // Resolve with the default value if parsing fails.
          resolve(defaultValue);
        }
      } else {
        // Resolve with the default value if the key does not exist in storage.
        resolve(defaultValue);
      }
    });
  });
}

function useChromeStorageLocal<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Asynchronously get the stored value from chrome.storage.local
    chrome.storage.local.get([key], (result: ChromeStorageLocalSet) => {
      if (result[key] !== undefined) {
        try {
          setValue(JSON.parse(result[key]) as T);
        } catch (error) {
          console.debug("[Warning] Error parsing value from storage:", error);
          setValue(result[key] as unknown as T);
        }
      }
      setHasLoaded(true); // Update loaded state to true after fetching the value
    });
  }, [key]);

  useEffect(() => {
    // Function to handle changes in chrome.storage.local
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes[key]) {
        try {
          const newValue = changes[key].newValue;
          setValue(JSON.parse(newValue) as T);
        } catch (error) {
          if (error instanceof SyntaxError) {
            setValue(changes[key].newValue as unknown as T);
          } else {
            console.debug(
              "[Warning] Error parsing updated value from storage:",
              error
            );
          }
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
    chrome.storage.local.set({ [key]: JSON.stringify(valueToStore) });
  };

  return [value, setStoredValue, hasLoaded];
}

export { useChromeStorageLocal, getFromChromeStorage };
