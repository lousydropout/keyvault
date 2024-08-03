export interface Encrypted {
  iv: string;
  ciphertext: string;
}

export interface Keys {
  key: CryptoKey;
  wrappedKey: string;
}

// Utility functions for encoding and decoding
function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Function to derive a key from a password
async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
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
}

// Function to generate a secret key
async function generateKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
}

// Function to generate a secret key
async function generateWrappedKey(password: string): Promise<Keys> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return {
    key,
    wrappedKey: await wrapKey(key, password),
  };
}

// Export JWK-formatted key
async function exportCryptoKey(key: CryptoKey): Promise<JsonWebKey> {
  return await window.crypto.subtle.exportKey("jwk", key);
}

// Import JWK-formatted key
async function importCryptoKey(jwkString: JsonWebKey): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwkString,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Function to wrap an AES key with a password using AES-KW
async function wrapKey(
  targetKey: CryptoKey,
  password: string
): Promise<string> {
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
}

// Function to unwrap an AES key with a password using AES-KW
async function unwrapKey(
  wrappedKeyWithSalt: string,
  password: string
): Promise<CryptoKey> {
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
}

// Encrypt via AES-GCM
async function encrypt(key: CryptoKey, plaintext: string): Promise<Encrypted> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const secret = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv, tagLength: 128 },
    key,
    secret
  );

  return { iv: bufferToBase64(iv), ciphertext: bufferToBase64(ciphertext) };
}

// Decrypt AES-GCM encrypted ciphertext
async function decrypt(key: CryptoKey, encrypted: Encrypted): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuffer(encrypted.iv), tagLength: 128 },
    key,
    base64ToBuffer(encrypted.ciphertext)
  );
  return new TextDecoder("utf-8").decode(decrypted);
}

// hashing function
async function hash(inputString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

export {
  generateKey,
  generateWrappedKey,
  wrapKey,
  unwrapKey,
  exportCryptoKey,
  importCryptoKey,
  encrypt,
  decrypt,
  hash,
};

// async function generateQRCode(wrappedKey) {
//   // Assuming wrappedKey is a Base64 string
//   const typeNumber = 10; // Type number (1 to 40) indicates the size of the QR Code
//   const errorCorrectionLevel = "H"; // Error correction level: 'L', 'M', 'Q', 'H'
//   const qr = qrcode(typeNumber, errorCorrectionLevel);
//   qr.addData(wrappedKey);
//   qr.make();
//   document.getElementById("qr").innerHTML = qr.createImgTag();
// }

// Example making use of the above functions
// async function example() {
//   const password = "myPassword123---";
//   const plaintext = "Hello, world!";

//   let { key, wrappedKey } = await generateKey(password);
//   console.log("Wrapped Key:", wrappedKey);

//   const encrypted = await encrypt(key, plaintext);
//   console.log("encrypted:", JSON.stringify(encrypted));

//   // decrypt starting from `key`
//   let decoded = await decrypt(key, encrypted);
//   if (decoded !== plaintext) console.error("Could not decrypt using `key`");

//   // decrypt starting from `wrappedKey`
//   key = await unwrapKey(wrappedKey, password);
//   decoded = await decrypt(key, encrypted);
//   if (decoded !== plaintext)
//     console.error("Could not decrypt using `wrappedKey`");

//   // generateQRCode(wrappedKey);
// }
// example();
