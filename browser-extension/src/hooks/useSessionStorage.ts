import { useState, useEffect } from "react";

// Define a generic type T for the value to be stored in session storage
function useSessionStorage<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Attempt to get the stored value from session storage.
  // Parse the stored JSON string back into a TypeScript value of type T.
  const stored = sessionStorage.getItem(key);
  const initial = stored ? JSON.parse(stored) : defaultValue;
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    // Convert the value back into a JSON string for storage in session storage.
    sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  // Return the current value and the setter function, both typed correctly.
  return [value, setValue];
}

export { useSessionStorage };
