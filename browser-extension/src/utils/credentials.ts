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
 * @remarks `maintainOrderInChain` assumes that the on-chain creds are time-ordered (that is, the chains
 *   satisfy timestamp monotonicity).
 * @throws {Error} If any credential in either array does not have a 'next' field.
 */
export const mergeCreds = (
  currCreds: ExtendedCred[],
  onChainCreds: ExtendedCred[],
  maintainOrderInChain: boolean = false
): ValidCred[] => {
  // Verify that all creds have field 'next'
  const currCredsWithoutNext = currCreds.filter(
    (cred) => cred.next === undefined
  );
  const onChainCredsWithoutNext = onChainCreds.filter(
    (cred) => cred.next === undefined
  );
  if (currCredsWithoutNext.length + onChainCredsWithoutNext.length > 0) {
    throw new Error("All credentials must have a 'next' field");
  }

  // Clone onChainCreds to avoid modifying the original array
  let result = structuredClone(onChainCreds) as ValidCred[];

  // Verify `currCreds`' on-chain creds are in the correct location
  // num: number of creds in `currCreds` that are already on-chain
  const num = currCreds.filter((c) => c.encrypted.onChain).length;
  for (let i = 0; i < num; i++) {
    if (currCreds[i].id !== onChainCreds[i].id)
      throw new Error(
        "[mergeCreds] on-chain creds in `currCreds` are not in the correct location"
      );
  }

  // Main logic: append off-chain creds to the appropriate chain
  for (let i = num; i < currCreds.length; i++) {
    let cred = currCreds[i];

    if (isHeadOfChain(cred)) {
      result.push({ ...cred, curr: result.length, next: -1 });
    } else {
      let prev = currCreds[cred.prev] as ValidCred;
      prev = result[prev.curr];

      // Go to the current tail of the chain in `result`
      while (!isTailOfChain(prev as ExtendedCred)) {
        if (prev.next === undefined)
          throw new Error("[mergeCreds] prev.next is undefined");
        prev = result[prev.next];
      }

      // Modifying new (potentially temporary) tail of the chain
      cred.prev = prev.curr;
      cred.curr = result.length;
      cred.next = -1;

      // Append the new tail to the result
      result.push(cred);
    }
  }

  // Optional: maintain time-orderedness (timestamp monotonicity)
  // Assumes that the chains on-chain are already in the correct order
  if (maintainOrderInChain) {
    const toBeDeleted = markForDeletion(addNext(result));
    result = deleteMulti(result, toBeDeleted);
  }

  // Delete "next" field from all creds in result since they're no longer correct
  for (let i = 0; i < result.length; i++) delete result[i].next;

  return result;
};

/**
 * Adds the "next" property to each credential in the array.
 * @param creds - The array of valid credentials.
 * @returns An array of extended credentials with the "next" property added.
 */
export const addNext = (creds: ValidCred[]): ExtendedCred[] => {
  // 1. Clone the creds array to avoid modifying the original array.
  const x = structuredClone(creds);

  // 2. Create an array of booleans to track which credentials have been processed.
  const done: boolean[] = x.map(() => false);

  // 3. Main logic
  for (let i = x.length - 1; i > 0; i--) {
    if (done[i]) continue; // skip if already processed

    // If not processed, then this cred is the tail of a chain.
    // Recurse from the tail to the head of the chain
    let curr = i;
    let next = -1; // the tail cred of a chain has a next of -1
    while (curr != -1) {
      if (done[curr]) throw new Error("[addNext] Cyclic chain detected");

      done[curr] = true;
      x[curr].next = next;
      next = curr;
      curr = x[curr].prev;
    }
  }

  // 4. Verify that all credentials were processed and have a "next" property.
  if (done.includes(false))
    throw new Error("[addNext] Not all entries were processed");

  // 5. Verify that all credentials have a "next" property.
  if (x.some((cred) => cred.next === undefined))
    throw new Error("[addNext] Not all entries have a 'next' property");

  // 6. Return the updated array of credentials.
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
  // 1. Clone the creds array to avoid modifying the original array.
  const _creds = structuredClone(creds);

  // 2. Check if the credential is allowed to be deleted
  if (creds[k].encrypted.onChain)
    throw new Error("Cannot delete on-chain cred");

  const result: ValidCred[] = [];

  for (let i = 0; i < _creds.length; i++) {
    const cred = _creds[i];

    if (cred.curr < k) {
      result.push(cred);
    } else if (cred.curr > k) {
      const newCred = structuredClone(cred);
      cred.curr = cred.curr - 1;
      if (cred.prev > k) {
        newCred.prev = newCred.prev - 1;
      } else if (cred.prev == k) {
        newCred.prev = _creds[newCred.prev].prev;
      }
      result.push(newCred);
    }
  }

  return result;
};

const isHeadOfChain = (cred: ValidCred): boolean => cred.prev === -1;
const isTailOfChain = (cred: ExtendedCred): boolean => cred.next === -1;

/**
 * Deletes multiple elements from an array of ValidCred objects and returns the updated array.
 *
 * @param creds - The array of ValidCred objects.
 * @param toBeDeleted - An array of booleans indicating which elements should be deleted.
 * @returns The updated array of ValidCred objects after deleting the specified elements.
 */
export const deleteMulti = (
  creds: ValidCred[],
  toBeDeleted: boolean[],
  throwExceptionIfOnChain: boolean = true
): ValidCred[] => {
  // 1. Clone the creds array to avoid modifying the original array.
  const _creds = structuredClone(creds);

  // 2. Check if the credentials to be deleted are allowed to be deleted
  for (let i = 0; i < _creds.length; i++) {
    if (!toBeDeleted[i]) continue;

    if (_creds[i].encrypted.onChain && throwExceptionIfOnChain)
      throw new Error(
        "Cannot delete on-chain cred. Set throwExceptionIfOnChain to false to ignore this error."
      );
  }

  // 3. Create an array to store the result
  const result: ValidCred[] = [];

  // `offsets` track how many positions to shift the 'curr' and 'prev' values
  const offsets = new Array(_creds.length).fill(0);
  let shift = 0;
  for (let i = 0; i < _creds.length; i++) {
    if (toBeDeleted[i]) shift++;
    offsets[i] = shift;
  }

  // 4. Main logic for result
  // Note: the following uses a cred's `curr` field to propagate the updated `prev` value
  for (let k = 0; k < _creds.length; k++) {
    const prev = _creds[k].prev;

    // branch on whether to delete cred
    if (toBeDeleted[k]) {
      if (isHeadOfChain(_creds[k])) {
        _creds[k].curr = -1;
      } else {
        _creds[k].curr = _creds[prev].curr;
      }
    } else {
      // not to be deleted, but might need to update its `prev` field

      // update curr
      _creds[k].curr -= offsets[k];

      // update prev
      // Note: if cred is the head of a chain, its `prev` remain unchanged as -1
      if (!isHeadOfChain(_creds[k])) _creds[k].prev = _creds[prev].curr;

      // push to result
      result.push(_creds[k]);
    }
  }

  // 5. Return the updated array of credentials
  return result;
};

/**
 * Marks the credentials for deletion by checking for violations in the
 * chain's time-orderedness (monotonicity property of timestamps).
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

    let curr = j; // store `j` in `curr` (to be updated and used in the loop)
    let t = undefined; // initialize t for the new chain
    while (curr !== -1) {
      done[curr] = true;
      if (t === undefined || t < extended[curr].timestamp) {
        // since the chain is time-ordered (thus far), we can delete the cred
        // set the current timestamp (new max) to be the new `t`
        t = extended[curr].timestamp;
      } else {
        // if the chain is not time-ordered, we mark cred for deletion if it is NOT already on-chain
        toBeDeleted[curr] = !extended[curr].encrypted.onChain;
      }
      curr = extended[curr].next;
    }
  }

  // verify that all creds were processed
  if (done.includes(false))
    throw new Error("[markForDeletion] Not all entries were processed");

  // Return the array of booleans indicating which credentials should be deleted
  return toBeDeleted;
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
  // Clone on-chain encrypteds and decrypt them
  const encrypteds = structuredClone(onChain);
  const ocCreds = await decryptEntries(cryptoKey, encrypteds);

  // Verify that the on-chain credentials are all valid
  for (let i = 0; i < ocCreds.length; i++) {
    const lastOcCred = ocCreds[i];
    if (!lastOcCred.isValid)
      throw new Error("[merge] Invalid on-chain credential");
  }

  // decrypt encrypteds
  const onChainCreds = await decryptEntries(cryptoKey, onChain);
  const currCreds = await decryptEntries(cryptoKey, curr);

  // merge on-chain and off-chain creds
  let mergedCreds = mergeCreds(
    addNext(currCreds as ValidCred[]),
    addNext(onChainCreds as ValidCred[]),
    maintainOrderInChain
  );

  // get merged creds' encrypted if on-chain, otherwise encrypt
  return Promise.all(
    mergedCreds.map((cred) => {
      if (cred.encrypted.onChain) return cred.encrypted;
      return encrypt(cryptoKey, cred);
    })
  );
};

/**
 * Validates the chains' properties.
 * Ensures that the chains are time-ordered (that the timestamps of the
 * credentials are monotonically increasing).
 *
 * @param creds - An array of credentials to validate.
 * @returns `true` if the chain properties are valid, otherwise `false`.
 * @throws Will throw an error if not all entries were processed.
 */
export const validateChainProperties = (creds: ValidCred[]): boolean => {
  const done: boolean[] = creds.map(() => false);
  const extended = addNext(creds);

  for (let i = 0; i < extended.length; i++) {
    if (done[i]) continue;

    let t = undefined;
    let curr = i;
    while (curr !== -1) {
      if (t === undefined || t < extended[curr].timestamp) {
        // chain is thusfar time-ordered
        t = extended[curr].timestamp;
      } else {
        // chain is not time-ordered
        return false;
      }

      done[curr] = true;
      curr = extended[curr].next;
    }
  }

  if (done.includes(false))
    throw new Error("[validateChainProperties] Not all entries were processed");
  return true;
};
