export type Encrypted = {
  iv: string;
  ciphertext: string;
  onChain: boolean;
};

export type Keys = {
  key: CryptoKey;
  wrappedKey: string;
};

/**
 * Converts an ArrayBuffer to a base64 string.
 *
 * @param buffer - The ArrayBuffer to convert.
 * @returns The base64 string representation of the ArrayBuffer.
 */
export const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

/**
 * Converts a base64 string to an ArrayBuffer.
 *
 * @param base64 - The base64 string to convert.
 * @returns The converted ArrayBuffer.
 */
export const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Derives a cryptographic key from a password using PBKDF2 algorithm.
 *
 * @param password - The password to derive the key from.
 * @param salt - The salt value used in the key derivation process.
 * @returns A promise that resolves to the derived CryptoKey.
 */
export const deriveKeyFromPassword = async (
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> => {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 1_000_000,
      hash: { name: "SHA-512" },
    },
    passwordKey,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );
};

/**
 * Generates a cryptographic key using AES-GCM algorithm with a length of 256 bits.
 * The generated key can be used for encryption and decryption operations.
 *
 * @returns A promise that resolves to a CryptoKey object representing the generated key.
 */
export const generateKey = (): Promise<CryptoKey> =>
  crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);

/**
 * Generates a wrapped key using the provided password.
 *
 * @param password - The password used to generate the key.
 * @returns A Promise that resolves to an object containing the generated key and the wrapped key.
 */
export const generateWrappedKey = async (password: string): Promise<Keys> => {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const wrappedKey = await wrapKey(key, password);

  return { key, wrappedKey };
};

/**
 * Exports a CryptoKey as a JsonWebKey.
 *
 * @param key - The CryptoKey to be exported.
 * @returns A promise that resolves with the exported JsonWebKey.
 */
export const exportCryptoKey = (key: CryptoKey): Promise<JsonWebKey> => {
  return window.crypto.subtle.exportKey("jwk", key);
};

/**
 * Imports a JSON Web Key (JWK) and returns a Promise that resolves to a CryptoKey.
 *
 * @param jwkString - The JSON Web Key string to import.
 * @returns A Promise that resolves to a CryptoKey.
 */
export const importCryptoKey = (jwkString: JsonWebKey): Promise<CryptoKey> => {
  return window.crypto.subtle.importKey(
    "jwk",
    jwkString,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

/**
 * Wraps a given target key with a wrapping key derived from a password.
 *
 * @param targetKey - The target key to be wrapped.
 * @param password - The password used to derive the wrapping key.
 * @returns A promise that resolves to the wrapped key as a string.
 *
 * Note: The resulting wrapped key can be "unwrapped" using the `unwrapKey` function.
 */
export const wrapKey = async (
  targetKey: CryptoKey,
  password: string
): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrappingKey = await deriveKeyFromPassword(password, salt);

  const wrappedKey = await crypto.subtle.wrapKey(
    "raw",
    targetKey,
    wrappingKey,
    { name: "AES-KW" }
  );

  const result = new Uint8Array(salt.length + wrappedKey.byteLength);
  result.set(salt, 0);
  result.set(new Uint8Array(wrappedKey), salt.length);

  return bufferToBase64(result.buffer);
};

/**
 * Unwraps the base64 string of wrapped key using a password.
 *
 * @param wrappedKeyWithSalt - The wrapped key with salt encoded as a base64 string.
 * @param password - The password used to derive the wrapping key.
 * @returns A promise that resolves to the unwrapped CryptoKey.
 */
export const unwrapKey = async (
  wrappedKeyWithSalt: string,
  password: string
): Promise<CryptoKey> => {
  const decodedData = base64ToBuffer(wrappedKeyWithSalt);
  const salt = new Uint8Array(decodedData.slice(0, 16));
  const wrappedKey = new Uint8Array(decodedData.slice(16));
  const wrappingKey = await deriveKeyFromPassword(password, salt);

  return crypto.subtle.unwrapKey(
    "raw",
    wrappedKey,
    wrappingKey,
    { name: "AES-KW" },
    { name: "AES-GCM", length: 256 }, // Assumes the unwrapped key is for AES-GCM encryption/decryption
    true,
    ["encrypt", "decrypt"]
  );
};

/**
 * Encrypts the given plaintext using 256-bit AES-GCM using the provided key.
 *
 * @param key - The cryptographic key used for encryption.
 * @param plaintext - The plaintext to be encrypted. It can be either a string or an object.
 * @returns A promise that resolves to an object containing the initialization vector (iv) and the ciphertext.
 */
export const encrypt = async (
  key: CryptoKey,
  plaintext: string | object
): Promise<Encrypted> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const x =
    typeof plaintext === "object" ? JSON.stringify(plaintext) : plaintext;
  const secret = new TextEncoder().encode(x);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv, tagLength: 128 },
    key,
    secret
  );

  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
    onChain: false,
  };
};

export const parseEncryptedText = (encryptedText: string) => {
  const iv = encryptedText.slice(0, 16);
  const ciphertext = encryptedText.slice(16);
  return { iv, ciphertext, onChain: true };
};

/**
 * Decrypts the given 256-bit AES-GCM encrypted data using the provided key.
 *
 * @param cryptoKey - The cryptographic key used for decryption.
 * @param encrypted - The encrypted data to be decrypted.
 * @returns A promise that resolves to the decrypted data as a string.
 */
export const decrypt = async (
  cryptoKey: CryptoKey,
  encrypted: Encrypted
): Promise<string> => {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBuffer(encrypted.iv), tagLength: 128 },
      cryptoKey,
      base64ToBuffer(encrypted.ciphertext)
    );
    return new TextDecoder("utf-8").decode(decrypted);
  } catch (e) {
    console.error("[decrypt] Error: ", e);
    throw e;
  }
};

/**
 * Computes the SHA-256 hash of the input string.
 *
 * @param inputString - The string to be hashed.
 * @returns A promise that resolves to the hexadecimal representation of the hash.
 */
export const hash = async (inputString: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

// const generateQRCode = async (wrappedKey: string):void => {
//   // Assuming wrappedKey is a Base64 string
//   const typeNumber = 10; // Type number (1 to 40) indicates the size of the QR Code
//   const errorCorrectionLevel = "H"; // Error correction level: 'L', 'M', 'Q', 'H'
//   const qr = qrcode(typeNumber, errorCorrectionLevel);
//   qr.addData(wrappedKey);
//   qr.make();
//   document.getElementById("qr").innerHTML = qr.createImgTag();
// }
