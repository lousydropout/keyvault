import { Encrypted, decrypt, encrypt } from "@/utils/encryption";
import { v4 as uuid, validate } from "uuid";

/*******************************************************************************
 * Types
 ******************************************************************************/

export type CredsByUrl = Record<string, PasswordCred[][]>;

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
  type: "password" | "keypair" | "secretShare";
  encrypted?: Encrypted; // is the source encrypted data.
  timestamp: string;
  prev: number;
  curr: number;
  next?: number;
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

export type KeypairCred = BaseCred & {
  encrypted: Encrypted;
  type: "keypair";
  publicKey: string;
  privateKey: string;
};

export type SecretShareCred = BaseCred & {
  encrypted: Encrypted;
  type: "secretShare";
  share: string;
  for: string;
  secretTitle: string;
  additionalInfo: string;
};

export type ValidCred = (PasswordCred | KeypairCred | SecretShareCred) & {
  next?: number;
};
export type ExtendedCred = ValidCred & { next: number };
export type Cred = ValidCred | InvalidCred;

export type Unencrypted = {
  passwords: PasswordCred[];
  keypairs: KeypairCred[];
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

const isKeypairCred = (obj: any): obj is KeypairCred => {
  if (!isBaseCred(obj)) return false;

  return (
    obj.type === "keypair" &&
    "publicKey" in obj &&
    typeof obj.publicKey === "string" &&
    "privateKey" in obj &&
    typeof obj.privateKey === "string" &&
    "encrypted" in obj &&
    isEncryptedType(obj.encrypted)
  );
};

const isSecretShareCred = (obj: any): obj is SecretShareCred => {
  if (!isBaseCred(obj)) return false;

  return (
    obj.type === "secretShare" &&
    "share" in obj &&
    typeof obj.share === "string" &&
    "for" in obj &&
    typeof obj.for === "string" &&
    "secretTitle" in obj &&
    typeof obj.secretTitle === "string" &&
    "additionalInfo" in obj &&
    typeof obj.additionalInfo === "string" &&
    "encrypted" in obj &&
    isEncryptedType(obj.encrypted)
  );
};

export const isValidCred = (obj: any): obj is PasswordCred | KeypairCred =>
  isPasswordCred(obj) || isKeypairCred(obj) || isSecretShareCred(obj);

export const isCred = (obj: any): obj is Cred =>
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
    const obj = {
      isValid: true,
      ...JSON.parse(decrypted),
      encrypted,
    };

    if (isValidCred(obj)) return obj;

    return { isValid: false, encrypted };
  } catch (e) {
    console.log("[decryptEntry] error: ", e);
    return { isValid: false, encrypted };
  }
};

/**
 * Decrypts an array of encrypted entries using the provided crypto key.
 *
 * @param cryptoKey - The crypto key used for decryption.
 * @param encrypteds - The array of encrypted entries to be decrypted.
 * @returns {Promise<Cred[]>} A promise that resolves to an array of credentials.
 * @example
 * ```ts
 *   const cryptoKey = await generateCryptoKey();
 *   const encryptedData = [encrypted1, encrypted2, encrypted3];
 *   const credentials = await decryptEntries(cryptoKey, encryptedData);
 *   console.log(credentials);
 * ```
 */
export const decryptEntries = async (
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
export const getKeypairs = (creds: Cred[]): KeypairCred[] =>
  creds.filter(isKeypairCred);

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

/**
 * Merges two arrays of credentials into a single array of valid credentials.
 *
 * @param currCreds - The current credentials array.
 * @param onChainCreds - The on-chain credentials array.
 * @param maintainOrderInChain - Optional. Specifies whether to maintain the order of credentials in the on-chain array. Defaults to false.
 * @returns The merged array of valid credentials.
 * @throws {Error} If any credential in either array does not have a 'next' field.
 */
export const mergeCreds = (
  currCreds: ExtendedCred[],
  onChainCreds: ExtendedCred[],
  maintainOrderInChain: boolean = false
): ValidCred[] => {
  // check that all creds have field 'next'
  const currCredsWithoutNext = currCreds.filter(
    (cred) => cred.next === undefined
  );
  const onChainCredsWithoutNext = onChainCreds.filter(
    (cred) => cred.next === undefined
  );

  if (currCredsWithoutNext.length + onChainCredsWithoutNext.length > 0) {
    throw new Error("All credentials must have a 'next' field");
  }

  let creds = structuredClone(onChainCreds) as ValidCred[];

  for (
    let i = currCreds.filter((c) => c.encrypted.onChain).length;
    i < currCreds.length;
    i++
  ) {
    let cred = currCreds[i];

    if (cred.prev === -1) {
      creds.push({ ...cred, curr: creds.length, next: -1 });
    } else {
      let prev = currCreds[cred.prev] as ValidCred;
      prev = creds[prev.curr];

      while (prev.next !== -1) {
        if (prev.next === undefined) throw new Error("prev.next is undefined");
        prev = creds[prev.next];
      }

      cred.prev = prev.curr;
      cred.curr = creds.length;
      cred.next = -1;
      creds.push(cred);
    }
  }

  if (maintainOrderInChain) {
    const toBeDeleted = markForDeletion(addNext(creds));
    creds = deleteMulti(creds, toBeDeleted);
  }

  return creds;
};

/**
 * Adds the "next" property to each credential in the array.
 * @param creds - The array of valid credentials.
 * @returns An array of extended credentials with the "next" property added.
 */
export const addNext = (creds: ValidCred[]): ExtendedCred[] => {
  const x = structuredClone(creds);
  const done: boolean[] = x.map(() => false);

  for (let i = x.length - 1; i > 0; i--) {
    let curr = i;
    if (done[curr]) continue;

    let next = -1;
    while (curr != -1 && !done[curr]) {
      done[curr] = true;
      x[curr].next = next;
      next = curr;
      curr = x[curr].prev;
    }
  }

  return x as ExtendedCred[];
};

/**
 * Deletes a credential from the array of valid credentials.
 * @param creds - The array of valid credentials.
 * @param k - The index of the credential to delete.
 * @returns The updated array of valid credentials after deletion.
 * @throws {Error} If the credential to delete is on-chain.
 */
export const deleteK = (creds: ValidCred[], k: number): ValidCred[] => {
  if (creds[k].encrypted.onChain)
    throw new Error("Cannot delete on-chain cred");

  const x: ValidCred[] = [];

  for (let i = 0; i < creds.length; i++) {
    const cred = creds[i];

    if (cred.curr < k) {
      x.push(cred);
    } else if (cred.curr > k) {
      const newCred = structuredClone(cred);
      cred.curr = cred.curr - 1;
      if (cred.prev > k) {
        newCred.prev = newCred.prev - 1;
      } else if (cred.prev == k) {
        newCred.prev = creds[newCred.prev].prev;
      }
      x.push(newCred);
    }
  }

  return x;
};

/**
 * Marks the credentials for deletion.
 *
 * @param creds - An array of ExtendedCred objects representing the credentials.
 * @returns An array of booleans indicating which credentials should be deleted.
 */
export const markForDeletion = (creds: ExtendedCred[]): boolean[] => {
  const done: boolean[] = creds.map(() => false);
  const toBeDeleted: boolean[] = creds.map(() => false);
  const extended = addNext(creds);

  for (let j = 0; j < extended.length; j++) {
    if (done[j]) continue;
    done[j] = true;

    let curr = j;
    let t = undefined;
    while (curr !== -1) {
      done[curr] = true;
      if (t === undefined || t < extended[curr].timestamp) {
        t = extended[curr].timestamp;
      } else {
        if (!extended[curr].encrypted.onChain) toBeDeleted[curr] = true;
        t = undefined;
      }
      curr = extended[curr].next;
    }
  }
  return toBeDeleted;
};

/**
 * Deletes multiple credentials from the given array based on the provided boolean flags.
 *
 * @param creds - The array of valid credentials.
 * @param toBeDeleted - The array of boolean flags indicating which credentials should be deleted.
 * @returns The updated array of valid credentials after deletion.
 */
const deleteMulti = (
  creds: ValidCred[],
  toBeDeleted: boolean[]
): ValidCred[] => {
  let results: ValidCred[] = structuredClone(creds);
  for (let k = results.length - 1; k >= 0; k--) {
    if (toBeDeleted[k]) results = deleteK(results, k);
  }
  return results;
};

/**
 * Merges the on-chain and off-chain credentials.
 *
 * @param cryptoKey - The cryptographic key used for encryption and decryption.
 * @param onChain - The array of encrypted on-chain credentials.
 * @param curr - The array of encrypted off-chain credentials.
 * @param maintainOrderInChain - Optional. Specifies whether to maintain the order of credentials in the on-chain array. Defaults to false.
 * @returns A promise that resolves to the array of merged and encrypted credentials.
 * @throws {Error} If the last on-chain credential is invalid.
 */
export const merge = async (
  cryptoKey: CryptoKey,
  onChain: Encrypted[],
  curr: Encrypted[],
  maintainOrderInChain: boolean = false
): Promise<Encrypted[]> => {
  const encrypteds = structuredClone(onChain);
  const ocCreds = await decryptEntries(cryptoKey, encrypteds);

  const lastOcCred = ocCreds[ocCreds.length - 1];
  if (!lastOcCred.isValid) throw new Error("Invalid on-chain credential");

  // parse on-chain credentials
  const onChainCreds = await decryptEntries(cryptoKey, onChain);
  const currCreds = await decryptEntries(cryptoKey, curr);

  // merge on-chain and off-chain creds
  let mergedCreds = mergeCreds(
    addNext(currCreds as ValidCred[]),
    addNext(onChainCreds as ValidCred[]),
    maintainOrderInChain
  );

  // get merged creds' encrypted
  return Promise.all(
    mergedCreds.map((cred) => {
      if (cred.encrypted.onChain) return cred.encrypted;
      return encrypt(cryptoKey, cred);
    })
  );
};
