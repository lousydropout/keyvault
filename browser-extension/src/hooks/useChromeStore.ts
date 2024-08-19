import { useEffect, useState } from "react";

type ChromeStorageSet = {
  [key: string]: any; // To accommodate JSON parsing
};

/**
 * Custom hook for managing storage using the Chrome Storage API.
 *
 * @template T - The type of the stored value.
 * @param {string} key - The key used to store the value in the storage.
 * @param {T} defaultValue - The default value to be used if no value is found in the storage.
 * @param {boolean} [persist=false] - Determines whether to use local storage (true) or session storage (false).
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>, boolean]} - An array containing the stored value, a function to update the stored value, and a boolean indicating whether the value has been loaded from the storage.
 */
export const useChromeStore = <T>(
  key: string,
  defaultValue: T,
  persist: boolean = false
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  const [value, setValue] = useState<T>(defaultValue);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const storage = persist ? chrome.storage.local : chrome.storage.session;

  useEffect(() => {
    // Asynchronously get the stored value from the appropriate chrome storage
    storage.get([key], (result: ChromeStorageSet) => {
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
    // Function to handle changes in the appropriate chrome storage
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (
        (persist && areaName === "local") ||
        (!persist && areaName === "session")
      ) {
        if (changes[key]) {
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
      }
    };

    // Listen for changes in storage
    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup the listener when the component unmounts or the key or storage changes
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [key]);

  const setStoredValue: React.Dispatch<React.SetStateAction<T>> = (
    valueAction
  ) => {
    const valueToStore: T =
      valueAction instanceof Function ? valueAction(value) : valueAction;
    setValue(valueToStore);
    storage.set({ [key]: JSON.stringify(valueToStore) });
  };

  return [value, setStoredValue, hasLoaded];
};

/**
 * Custom hook for accessing and updating values in the Chrome local storage.
 *
 * @template T - The type of the value stored in the Chrome local storage.
 * @param {string} key - The key used to access the value in the Chrome local storage.
 * @param {T} defaultValue - The default value to be returned if the key does not exist in the Chrome local storage.
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>, boolean]} - A tuple containing the value, a function to update the value, and a boolean indicating whether the value has been loaded from the Chrome local storage.
 */
export const useChromeStoreLocal = <T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  return useChromeStore<T>(key, defaultValue, true);
};
