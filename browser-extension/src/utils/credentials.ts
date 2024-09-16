import { Encrypted, decrypt, encrypt } from "@/utils/encryption";
import { v4 as uuid, validate } from "uuid";

/*******************************************************************************
 * Types
 ******************************************************************************/

export type CredsByUrl = Record<string, Cred[][]>;

/**
 * Represents an invalid credential.
 *
 * @remarks
 * `reason` is currently unused
 */
export type InvalidCred = {
  isValid: false;
  encrypted: Encrypted;
  reason?:
    | "invalid_id"
    | "invalid_prev"
    | "invalid_curr"
    | "invalid_type"
    | "unable_to_decrypt";
};

export type BarePasswordCred = {
  type: "password";
  isDeleted: false;
  id: string;
  timestamp: string;
  url: string;
  username: string;
  password: string;
  description: string;
  curr: number;
  prev: number;
};

/**
 * Represents a base credential.
 *
 * @remarks
 * `isValid` and `encrypted` are not part of the encrypted data.
 */
export type BaseCred = {
  isValid: true; // indicates that the object is a valid credential.
  id: string;
  type: string;
  encrypted?: Encrypted; // is the source encrypted data.
  timestamp: string;
  curr: number;
  prev: number;
};

export type PasswordBaseCred = BaseCred & {
  encrypted: Encrypted;
  type: "password";
  isDeleted: boolean;
};

export type PasswordAdditionCred = PasswordBaseCred & {
  isDeleted: false;
  url: string;
  username: string;
  password: string;
  description: string;
};
export type PasswordDeletionCred = PasswordBaseCred & {
  isDeleted: true;
  url: string;
};
export type PasswordCred = PasswordAdditionCred | PasswordDeletionCred;

export type KeyPairCred = BaseCred & {
  encrypted: Encrypted;
  type: "keyPair";
  publicKey: string;
  privateKey: string;
};

export type Cred = PasswordCred | KeyPairCred | InvalidCred;

export type Unencrypted = {
  passwords: PasswordCred[];
  keyPairs: KeyPairCred[];
};

export type IndexedEntries = Record<string, PasswordCred>;

/*******************************************************************************
 * Type Guards
 ******************************************************************************/
const isEncryptedType = (obj: any): obj is Encrypted => {
  return (
    typeof obj === "object" &&
    "iv" in obj &&
    "ciphertext" in obj &&
    "onChain" in obj &&
    typeof obj.iv === "string" &&
    typeof obj.ciphertext === "string" &&
    typeof obj.onChain === "boolean"
  );
};

const isBaseCred = (obj: any): obj is BaseCred => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    validate(obj.id) &&
    typeof obj.timestamp === "string" &&
    typeof obj.curr === "number" &&
    typeof obj.prev === "number" &&
    typeof obj.prev === "number" &&
    typeof obj.curr === "number" &&
    obj.prev >= -1 &&
    obj.curr > obj.prev &&
    ("encrypted" in obj ? isEncryptedType(obj.encrypted) : true)
  );
};

const isPasswordBaseCred = (obj: any): obj is PasswordBaseCred => {
  if (!isBaseCred(obj)) return false;

  return (
    obj.type === "password" &&
    "isDeleted" in obj &&
    typeof obj.isDeleted === "boolean" &&
    "encrypted" in obj &&
    isEncryptedType(obj.encrypted)
  );
};

export const isPasswordAdditionCred = (
  obj: any
): obj is PasswordAdditionCred => {
  if (!isPasswordBaseCred(obj)) return false;

  return (
    "url" in obj &&
    typeof obj.url === "string" &&
    "username" in obj &&
    typeof obj.username === "string" &&
    "password" in obj &&
    typeof obj.password === "string" &&
    "description" in obj &&
    typeof obj.description === "string"
  );
};

export const isPasswordCred = (obj: any): obj is PasswordCred => {
  if (!isPasswordBaseCred(obj)) return false;
  return obj.isDeleted || isPasswordAdditionCred(obj);
};

export const basePasswordCred: PasswordAdditionCred = {
  type: "password",
  url: "",
  username: "",
  password: "",
  description: "",
  curr: -1,
  prev: -1,
  isDeleted: false,
  id: "base",
  timestamp: new Date().toISOString(),
  isValid: true,
  encrypted: {
    iv: "",
    ciphertext: "",
    onChain: false,
  },
};

export const createBarePasswordCred = (params: {
  url: string;
  username: string;
  password: string;
  description: string;
  curr: number;
  prev: number;
}): BarePasswordCred => {
  const result: BarePasswordCred = {
    type: "password",
    isDeleted: false,
    id: uuid(),
    timestamp: new Date().toISOString(),
    ...params,
  };
  return result;
};

export const updatePasswordCred = (
  cred: PasswordCred,
  params: {
    url?: string;
    username?: string;
    password?: string;
    description?: string;
    curr?: number;
  }
): PasswordCred => {
  return { ...cred, ...params, prev: cred.curr };
};

export const deletePasswordCred = (
  cred: PasswordCred,
  curr: number
): PasswordDeletionCred => {
  return {
    type: "password",
    id: uuid(),
    url: cred.url,
    encrypted: { iv: "", ciphertext: "", onChain: false },
    timestamp: new Date().toISOString(),
    isValid: true,
    isDeleted: true,
    prev: cred.curr,
    curr,
  };
};

export const convertToPasswordCred = async (
  cryptoKey: CryptoKey,
  cred: BarePasswordCred
): Promise<PasswordCred> => {
  const encrypted = await encrypt(cryptoKey, cred);

  return {
    ...cred,
    isValid: true,
    encrypted,
  };
};

const isKeyPairCred = (obj: any): obj is KeyPairCred => {
  if (!isBaseCred(obj)) return false;

  return (
    obj.type === "keyPair" &&
    "publicKey" in obj &&
    typeof obj.publicKey === "string" &&
    "privateKey" in obj &&
    typeof obj.privateKey === "string" &&
    "encrypted" in obj &&
    isEncryptedType(obj.encrypted)
  );
};

const isValidCred = (obj: any): obj is PasswordCred | KeyPairCred =>
  isPasswordCred(obj) || isKeyPairCred(obj);

const isCred = (obj: any): obj is Cred =>
  isValidCred(obj) || obj.isValid === false;

/*******************************************************************************
 * End of Type Guards
 ******************************************************************************/

/**
 * Decrypts an encrypted entry using the provided crypto key.
 *
 * @param {CryptoKey} cryptoKey - The crypto key used for decryption.
 * @param {Encrypted} encrypted - The encrypted data to be decrypted.
 * @returns {Promise<Cred[]>} A promise that resolves to a decrypted credential object.
 */
export const decryptEntry = async (
  cryptoKey: CryptoKey,
  encrypted: Encrypted
): Promise<Cred> => {
  try {
    const decrypted = await decrypt(cryptoKey, encrypted);
    return {
      isValid: true,
      encrypted,
      ...JSON.parse(decrypted),
    };
  } catch (e) {
    console.log("[decryptEntry] error: ", e);
    return { isValid: false, encrypted };
  }
};

/**
 * Converts encrypted data to credentials using the provided crypto key.
 * @param {CryptoKey} cryptoKey - The crypto key used for decryption.
 * @param {Encrypted[]} encrypteds - An array of encrypted data.
 * @returns {Promise<Cred[]>} A promise that resolves to an array of credentials.
 * @example
 * ```ts
 *   const cryptoKey = await generateCryptoKey();
 *   const encryptedData = [encrypted1, encrypted2, encrypted3];
 *   const credentials = await convertToCreds(cryptoKey, encryptedData);
 *   console.log(credentials);
 * ```
 */
export const convertToCreds = (
  cryptoKey: CryptoKey,
  encrypteds: Encrypted[]
): Promise<Cred[]> => {
  return Promise.all(encrypteds.map((entry) => decryptEntry(cryptoKey, entry)));
};

/**
 * Decrypts an array of encrypted entries using the provided crypto key.
 *
 * @param cryptoKey - The crypto key used for decryption.
 * @param encrypteds - The array of encrypted entries to be decrypted.
 * @returns A promise that resolves to an array of decrypted credentials.
 */
export const decryptEntries = (
  cryptoKey: CryptoKey,
  encrypteds: Encrypted[]
): Promise<Cred[]> => {
  return Promise.all(
    encrypteds.map((encrypted) => decryptEntry(cryptoKey, encrypted))
  );
};

/**
 * Retrieves the key pairs from the given credentials.
 *
 * @param creds - The array of credentials.
 * @returns An array of key pair credentials.
 */
export const getKeyPairs = (creds: Cred[]): KeyPairCred[] =>
  creds.filter(isKeyPairCred);

/**
 * Retrieves password chains from an array of credentials.
 *
 * @param {Cred[]} creds - The array of credentials.
 * @returns {Record<number, PasswordCred[]>} An object containing password chains.
 */
export const getPasswordChains = (
  creds: Cred[]
): Record<number, PasswordCred[]> => {
  const passwords: Record<number, PasswordCred[]> = {};
  const prevs: Record<number, number> = { "-1": -1 };

  for (let i = 0; i < creds.length; i++) {
    if (!isPasswordCred(creds[i])) continue;

    const pw = creds[i] as PasswordCred;
    prevs[pw.curr] = pw.prev;

    let first = pw.curr;
    while (prevs[first] >= 0) first = prevs[first];
    if (!(first in passwords)) passwords[first] = [];
    passwords[first].push(pw);
  }
  return passwords;
};

/**
 * Retrieves credentials by URL.
 *
 * @param {Cred[]} creds - An array of credentials.
 * @returns {CredsByUrl} An object containing credentials grouped by URL.
 * @example See credentials.test.ts for usage examples.
 */
export const getCredsByUrl = (creds: Cred[]): CredsByUrl => {
  const credsByUrl: CredsByUrl = {};
  const passwords = getPasswordChains(creds);

  for (let i = 0; i < creds.length; i++) {
    if (!(i in passwords)) continue;
    const chain = passwords[i];
    const url = chain[0].url;
    if (!(url in credsByUrl)) credsByUrl[url] = [];
    credsByUrl[url].push(chain);
  }

  return credsByUrl;
};
