/**
 * Downloads the given data as a JSON file with the specified filename.
 *
 * @param data - The data to be downloaded.
 * @param filename - The default name given to the file to be downloaded.
 */
export const download = (data: Record<string, any>, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};

/**
 * Converts an object to an array based on the provided key index.
 *
 * @param obj - The object to be converted.
 * @param keyIndex - An array of keys to extract values from the object.
 * @returns An array of values corresponding to the keys in the keyIndex. If a key is not found in the object, `null` is placed in the array.
 */
export const objToArray = (
  obj: Record<string, any>,
  keyIndex: readonly string[]
): any[] => {
  return keyIndex.map((u) => (obj[u] === undefined ? null : obj[u]));
};

/**
 * Converts an array of values into an object using a corresponding array of keys.
 *
 * @param obj - The array of values to be converted into an object.
 * @param keyIndex - The array of keys corresponding to the values in the `obj` array.
 * @returns An object where each key from `keyIndex` is associated with the corresponding value from `obj`.
 */
export const arrayToObj = (
  obj: any[],
  keyIndex: readonly string[]
): Record<string, any> => {
  let result: Record<string, any> = {};
  for (let i = 0; i < obj.length; i++) {
    const key = keyIndex[i];
    if (obj[i] !== null) result[key] = obj[i];
  }
  return result;
};

/**
 * Creates a key shortener utility that can shorten and recover objects based on a given key index.
 *
 * @param keyIndex - An array of strings representing the keys to be used for shortening and recovering objects.
 * @returns An object with two methods:
 *   - `shorten`: Takes an object or an array of objects and returns a shortened array representation.
 *   - `recover`: Takes a shortened array representation and returns the original object or array of objects.
 */
export const createKeyShortener = (keyIndex: readonly string[]) => {
  return {
    shorten: (obj: object): any[] => {
      const result = objToArray(obj, keyIndex);
      const k = result.findLastIndex((u) => u !== null);
      return result.slice(0, k + 1);
    },
    recover: (obj: any[]): object => arrayToObj(obj, keyIndex),
  };
};
