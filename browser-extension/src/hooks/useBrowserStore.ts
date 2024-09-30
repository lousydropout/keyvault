import { useEffect, useState } from "react";
import browser from "webextension-polyfill";

type StorageSet = {
  [key: string]: any;
};
type StorageChange = browser.Storage.StorageChange;

/**
 * Custom hook for managing storage using the WebExtension Storage API (browser.*).
 */
export const useBrowserStore = <T>(
  key: string,
  defaultValue: T,
  persist: boolean = false
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  const [value, setValue] = useState<T>(defaultValue);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const storage = persist ? browser.storage.local : browser.storage.session;

  useEffect(() => {
    // Asynchronously get the stored value from the appropriate browser storage
    storage.get([key]).then((result: StorageSet) => {
      if (result[key] !== undefined) {
        try {
          setValue(JSON.parse(result[key]) as T);
        } catch (error) {
          console.debug("[Warning] Error parsing value from storage:", error);
          setValue(result[key] as unknown as T);
        }
      }
      setHasLoaded(true);
    });
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: StorageChange },
      areaName: string
    ) => {
      if (
        (persist && areaName === "local") ||
        (!persist && areaName === "session")
      ) {
        if (changes[key]) {
          try {
            const newValue = changes[key].newValue;
            setValue(JSON.parse(newValue as string) as T);
          } catch (error) {
            setValue(changes[key].newValue as unknown as T);
          }
        }
      }
    };

    // Listen for changes in storage
    browser.storage.onChanged.addListener(handleStorageChange);

    // Cleanup the listener when the component unmounts or the key or storage changes
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
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
 * Custom hook for accessing and updating values in the Browser local storage.
 *
 * @template T - The type of the value stored in the Browser local storage.
 * @param {string} key - The key used to access the value in the Browser local storage.
 * @param {T} defaultValue - The default value to be returned if the key does not exist in the Browser local storage.
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>, boolean]} - A tuple containing the value, a function to update the value, and a boolean indicating whether the value has been loaded from the Browser local storage.
 */
export const useBrowserStoreLocal = <T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  return useBrowserStore<T>(key, defaultValue, true);
};
