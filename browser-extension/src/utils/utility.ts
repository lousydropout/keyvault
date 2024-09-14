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
 * Checks if a given string is a valid JSON Web Key (JWK).
 *
 * @param jwkString - The string representation of the JWK.
 * @returns A boolean indicating whether the JWK is valid or not.
 */
function isValidJWK(jwkString: string): boolean {
  try {
    const jwk = JSON.parse(jwkString);

    // Check if it's an object and contains required JWK properties
    if (
      typeof jwk === "object" &&
      jwk !== null &&
      "kty" in jwk && // Key Type (required)
      typeof jwk.kty === "string"
    ) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}
