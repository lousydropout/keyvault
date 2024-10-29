import { Encrypted, decrypt, encrypt } from "@/utils/encryption";
import { createKeyShortener } from "@/utils/utility";

/*******************************************************************************
 * Types
 ******************************************************************************/
export const CURRENT_VERSION: number = 1;

export const PASSWORD_TYPE = 0;
export const KEYPAIR_TYPE = 1;
export const SECRET_SHARE_TYPE = 2;

const baseIndex = ["version", "type", "id", "timestamp"];
export const passwordIndex = [
  ...baseIndex,
  "isDeleted",
  "url",
  "username",
  "password",
  "description",
];
export const keypairIndex = [...baseIndex, "publicKey", "privateKey"];
export const secretShareIndex = [
  ...baseIndex,
  "share",
  "for",
  "secretTitle",
  "additionalInfo",
];

const shortPw = createKeyShortener(passwordIndex);
const shortKeypair = createKeyShortener(keypairIndex);
const shortSecretShare = createKeyShortener(secretShareIndex);

export type CredsByUrl = Record<string, PasswordCred[][]>;
export type CredsMapping = Record<string, [string, number]>;

/**
 * Represents a base credential.
 *
 * @remarks
 * `isValid` and `encrypted` are not part of the encrypted data.
 */
export type BaseCred = {
  version: number;
  id: string | number; // number if PasswordCred else string
  type: number;
  timestamp: number;
};

export type PasswordBaseCred = BaseCred & {
  type: 0; // PASSWORD_TYPE;
  id: number;
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
  type: 1; // KEYPAIR_TYPE;
  id: number;
  publicKey: string;
  privateKey: string;
};
export type SecretShareCred = BaseCred & {
  type: 2; // SECRET_SHARE_TYPE;
  id: string;
  share: string;
  for: string;
  secretTitle: string;
  additionalInfo: string;
};

export type Cred = PasswordCred | KeypairCred | SecretShareCred;

export type Unencrypted = {
  passwords: PasswordCred[];
  keypairs: KeypairCred[];
};

const byTimestamp = (a: Cred, b: Cred) => a.timestamp - b.timestamp;

/*******************************************************************************
 * Type Guards
 ******************************************************************************/
const isEncryptedType = (obj: any): obj is Encrypted => {
  return (
    typeof obj === "object" &&
    "iv" in obj &&
    "ciphertext" in obj &&
    typeof obj.iv === "string" &&
    typeof obj.ciphertext === "string"
  );
};

export const isBaseCred = (obj: any): obj is BaseCred => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.type === "number" &&
    typeof obj.id === "number" &&
    typeof obj.timestamp === "number"
  );
};

const isPasswordBaseCred = (obj: any): obj is PasswordBaseCred => {
  if (!isBaseCred(obj)) return false;
  return "isDeleted" in obj && typeof obj.isDeleted === "boolean";
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
  version: CURRENT_VERSION,
  type: PASSWORD_TYPE,
  url: "",
  username: "",
  password: "",
  description: "",
  isDeleted: false,
  id: -1,
  timestamp: Date.now(),
};

/**
 * Generates a unique identifier using cryptographic random values.
 *
 * @returns {number} A randomly generated unique identifier.
 */
export const generateId = (): number => {
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);

  return randomValues[0];
};

/**
 * Creates a new password credential object.
 *
 * @param params - An object containing the following properties:
 * - `url`: The URL associated with the credential.
 * - `username`: The username for the credential.
 * - `password`: The password for the credential.
 * - `description`: A description of the credential.
 *
 * @returns A `PasswordCred` object containing the new password credential.
 */
export const createNewPasswordCred = (params: {
  url: string;
  username: string;
  password: string;
  description: string;
}): PasswordCred => {
  const result: PasswordCred = {
    version: CURRENT_VERSION,
    type: PASSWORD_TYPE,
    isDeleted: false,
    id: generateId(),
    timestamp: Date.now(),
    ...params,
  };
  return result;
};

/**
 * Updates the properties of a given PasswordCred object with the provided parameters.
 *
 * @param cred - The original PasswordCred object to be updated.
 * @param params - An object containing optional properties to update in the PasswordCred object.
 * @param params.url - (Optional) The new URL to be set.
 * @param params.username - (Optional) The new username to be set.
 * @param params.password - (Optional) The new password to be set.
 * @param params.description - (Optional) The new description to be set.
 * @returns The updated PasswordCred object with the new properties and a current timestamp.
 */
export const updatePasswordCred = (
  cred: PasswordCred,
  params: {
    url?: string;
    username?: string;
    password?: string;
    description?: string;
  }
): PasswordCred => {
  return { ...cred, ...params, timestamp: Date.now() };
};

/**
 * Deletes a password credential by marking it as deleted and adding metadata.
 *
 * @param cred - The password credential to be deleted.
 * @returns An object representing the deleted password credential with additional metadata.
 */
export const deletePasswordCred = (
  cred: PasswordCred
): PasswordDeletionCred => {
  return {
    version: CURRENT_VERSION,
    type: PASSWORD_TYPE,
    id: cred.id,
    url: cred.url,
    timestamp: Date.now(),
    isDeleted: true,
  };
};

/**
 * Checks if the given object is a KeypairCred.
 */
export const isKeypairCred = (obj: any): obj is KeypairCred => {
  if (!isBaseCred(obj)) return false;

  return (
    typeof obj === "object" &&
    obj.type === KEYPAIR_TYPE &&
    "publicKey" in obj &&
    typeof obj.publicKey === "string" &&
    obj.publicKey !== null &&
    "privateKey" in obj &&
    typeof obj.privateKey === "string" &&
    obj.privateKey !== null
  );
};

/**
 * Checks if the given object is a SecretShareCred.
 */
const isSecretShareCred = (obj: any): obj is SecretShareCred => {
  if (!isBaseCred(obj)) return false;

  return (
    obj.type === SECRET_SHARE_TYPE &&
    "share" in obj &&
    typeof obj.share === "string" &&
    "for" in obj &&
    typeof obj.for === "string" &&
    "secretTitle" in obj &&
    typeof obj.secretTitle === "string" &&
    "additionalInfo" in obj &&
    typeof obj.additionalInfo === "string"
  );
};

/**
 * Checks if the given object is a valid credential.
 */
export const isValidCred = (obj: any): obj is PasswordCred | KeypairCred =>
  isPasswordCred(obj) || isKeypairCred(obj) || isSecretShareCred(obj);

export const isCred = (obj: any): obj is Cred =>
  isValidCred(obj) || obj.isValid === false;

/*******************************************************************************
 * End of Type Guards
 ******************************************************************************/

/**
 * Encrypts an array of credentials using the provided CryptoKey.
 *
 * @param {CryptoKey} cryptoKey - The cryptographic key used for encryption.
 * @param {Cred[]} creds - An array of credentials to be encrypted.
 * @returns {Promise<Encrypted>} - A promise that resolves to the encrypted credentials.
 *
 * @throws {Error} If a credential type is unrecognized.
 */
export const encryptEntries = async (
  cryptoKey: CryptoKey,
  creds: Cred[]
): Promise<Encrypted> => {
  const shortened = creds.map((u: Cred) => {
    if (u.type === PASSWORD_TYPE) return shortPw.shorten(u);
    if (u.type === KEYPAIR_TYPE) return shortKeypair.shorten(u);
    if (u.type === SECRET_SHARE_TYPE) return shortSecretShare.shorten(u);
    throw new Error(`Unrecognized type: '${JSON.stringify(u)}'`);
  });
  return encrypt(cryptoKey, shortened as object[]);
};

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
): Promise<Cred[]> => {
  const _decrypteds = (await decrypt(cryptoKey, encrypted)) as any[];
  const decrypteds = _decrypteds.map((u) => {
    if (u[0] !== 1) throw new Error(`unrecognized version '${u[0]}`);
    if (u[1] === PASSWORD_TYPE) return shortPw.recover(u);
    if (u[1] === KEYPAIR_TYPE) return shortKeypair.recover(u);
    if (u[1] === SECRET_SHARE_TYPE) return shortSecretShare.recover(u);
  }) as Cred[];

  return decrypteds.filter((decrypted) => isValidCred(decrypted));
};

/**
 * Decrypts an array of encrypted entries using the provided crypto key.
 *
 * @param cryptoKey - The crypto key used for decryption.
 * @param encrypteds - The array of encrypted entries to be decrypted.
 * @returns {Promise<Cred[]>} A promise that resolves to an array of credentials.
 */
export const decryptEntries = async (
  cryptoKey: CryptoKey,
  encrypteds: Encrypted[]
): Promise<Cred[]> => {
  const _creds = await Promise.all(
    encrypteds.map((encrypted) => decryptEntry(cryptoKey, encrypted))
  );

  const results: Cred[] = [];
  for (let creds of _creds) results.push(...creds);
  return results;
};

export const prunePendingCreds = (onChain: Cred[], pending: Cred[]): Cred[] => {
  const onChainIds = new Set(onChain.map((c) => c.id));
  return pending.filter((c) => !onChainIds.has(c.id));
};

/**
 * Decrypts and categorizes encrypted credential entries.
 *
 * @param {CryptoKey} cryptoKey - The cryptographic key used for decryption.
 * @param {Encrypted[]} encrypteds - An array of encrypted credential entries.
 * @param {Cred[]} pendings - An array of pending credential entries.
 * @returns {Promise<{
 *   passwords: CredsByUrl;
 *   keypairs: KeypairCred[];
 *   secretShares: SecretShareCred[];
 *   pendings: Cred[];
 * }>} A promise that resolves to an object containing categorized credentials:
 *   - `passwords`: An object mapping URLs to password credentials.
 *   - `keypairs`: An array of keypair credentials.
 *   - `secretShares`: An array of secret share credentials.
 *   - `pendings`: An array of pending credentials.
 */
export const decryptAndCategorizeEntries = async (
  cryptoKey: CryptoKey,
  encrypteds: Encrypted[],
  pendings: Cred[]
): Promise<{
  passwords: CredsByUrl;
  keypairs: KeypairCred[];
  secretShares: SecretShareCred[];
  pendings: Cred[];
}> => {
  const result: {
    passwords: CredsByUrl;
    keypairs: KeypairCred[];
    secretShares: SecretShareCred[];
    pendings: Cred[];
  } = { passwords: {}, keypairs: [], secretShares: [], pendings: [] };

  const _creds = await decryptEntries(cryptoKey, encrypteds);
  _creds.push(...pendings);
  const seen = new Set();

  const passwords: PasswordCred[] = [];
  for (const cred of _creds) {
    if (seen.has(`${cred.id}${cred.timestamp}`)) continue;
    seen.add(`${cred.id}${cred.timestamp}`);

    if (isPasswordCred(cred)) {
      passwords.push(cred);
    } else if (isKeypairCred(cred)) {
      result.keypairs.push(cred);
    } else if (isSecretShareCred(cred)) {
      result.secretShares.push(cred);
    } else {
      console.log(
        `[decryptAndCategorizeEntries] Invalid/unrecognized cred: ${cred}`
      );
    }
  }

  result.passwords = getCredsByUrl(passwords);
  result.keypairs = result.keypairs.sort(byTimestamp);
  result.secretShares = result.secretShares.sort(byTimestamp);
  result.pendings = prunePendingCreds(_creds, pendings);

  return result;
};

/**
 * Retrieves credentials by URL.
 *
 * @param {Cred[]} creds - An array of credentials.
 * @returns {CredsByUrl} An object containing credentials grouped by URL.
 * @example See credentials.test.ts for usage examples.
 */
export const getCredsByUrl = (creds: Cred[]): CredsByUrl => {
  const chains: Record<string, PasswordCred[]> = {};
  const credsByUrl: CredsByUrl = {};

  // group by `id` into `chains`
  for (let i = 0; i < creds.length; i++) {
    const cred = creds[i];
    if (!isPasswordCred(cred)) continue;
    const id = cred.id.toString(16);

    if (!(id in chains)) chains[id] = [];
    chains[id].push(cred);
  }

  // sort each `chain` by timestamp
  for (const id in chains) chains[id] = chains[id].sort(byTimestamp);

  // add chains into credsByUrl
  for (const id in chains) {
    const chain = chains[id];
    const url = chain[chain.length - 1].url;
    if (!(url in credsByUrl)) credsByUrl[url] = [];
    credsByUrl[url].push(chain);
  }

  // order chains by timestamp in reverse order
  for (const url in credsByUrl) {
    credsByUrl[url] = credsByUrl[url].sort(
      (a, b) => b[b.length - 1].timestamp - a[a.length - 1].timestamp
    );
  }

  return credsByUrl;
};

/**
 * Generates a mapping from credentials by URL.
 *
 * This function takes an object where the keys are URLs and the values are arrays of credential chains.
 * It returns a mapping where the keys are credential IDs and the values are arrays containing the URL and the index of the credential chain.
 *
 * @param credsByUrl - An object where the keys are URLs and the values are arrays of credential chains.
 * @returns A mapping where the keys are credential IDs and the values are arrays containing the URL and the index of the credential chain.
 */
export const getMappingFromCredsByUrl = (
  credsByUrl: CredsByUrl
): CredsMapping => {
  const mapping: CredsMapping = {};

  for (const url in credsByUrl) {
    for (let i = 0; i < credsByUrl[url].length; i++) {
      const chain = credsByUrl[url][i];
      const cred = chain[0];
      mapping[cred.id] = [url, i];
    }
  }

  return mapping;
};

export const updateOrAddPasswordCred = (
  cred: Cred,
  record: CredsByUrl
): CredsByUrl => {
  if (!isPasswordCred(cred))
    throw new Error(
      `[updateWithNewPasswordCred] Invalid Password Cred: ${JSON.stringify(
        cred
      )}`
    );
  const result = structuredClone(record);
  const map = getMappingFromCredsByUrl(record);

  updateWithNewPasswordCredInPlace(cred, result, map);
  return result;
};

/**
 * Updates the credentials record with a new password credential.
 *
 * @param cred - The new password credential to be added.
 * @param record - The current credentials record, indexed by URL.
 * @param mapping - A mapping of credential IDs to their respective URL and index in the record.
 * @returns An object containing the updated credentials record and mapping.
 * @throws Will throw an error if the provided credential is not a valid password credential.
 * @throws Will throw an error if the mapping contains invalid data for `cred.id`.
 */
export const updateWithNewPasswordCred = (
  cred: Cred,
  record: CredsByUrl,
  mapping: CredsMapping
): {
  record: CredsByUrl;
  mapping: CredsMapping;
} => {
  if (!isPasswordCred(cred))
    throw new Error(
      `[updateWithNewPasswordCred] Invalid Password Cred: ${JSON.stringify(
        cred
      )}`
    );
  const result = structuredClone(record);
  const map = structuredClone(mapping);

  updateWithNewPasswordCredInPlace(cred, result, map);
  return { record: result, mapping: map };
};

export const updateWithNewPasswordCredInPlace = (
  cred: Cred,
  record: CredsByUrl,
  mapping: CredsMapping
) => {
  if (!isPasswordCred(cred))
    throw new Error(
      `[updateWithNewPasswordCredInPlace] Invalid Password Cred: ${JSON.stringify(
        cred
      )}`
    );

  const { id, url } = cred;
  if (!(url in record)) record[url] = [];

  const val = mapping[id];
  if (val) {
    const [prevUrl, prevIdx] = val;
    if (
      !(prevUrl in record) ||
      prevIdx > record[prevUrl].length ||
      record[prevUrl][prevIdx][0].id !== cred.id
    ) {
      // if the [prevUrl, prevIdx] we got from `mapping` is invalid, then
      // something is really wrong with our data
      throw new Error(
        `[updateWithNewPasswordCred] mapping['${prevUrl}'][${prevIdx}] does not exist`
      );
    }

    // move chain to new url
    const chain = record[prevUrl][prevIdx];
    record[url].push(chain);
    record[prevUrl].splice(prevIdx, 1);
  }

  const chainIdx = record[url].findIndex((u) => u[0].id === cred.id);
  if (val !== undefined && chainIdx === -1)
    throw new Error(`Chain with id ${cred.id} not found`);

  // add cred to chain
  if (chainIdx !== -1) record[url][chainIdx].push(cred);
  if (chainIdx === -1) record[url].push([cred]);

  // order chains by timestamp in reverse order
  record[url] = record[url].sort(
    (a, b) => b[b.length - 1].timestamp - a[a.length - 1].timestamp
  );

  // update mapping
  mapping[cred.id] = [url, chainIdx > -1 ? chainIdx : 0];
};

/*******************************************************************************
 * Keypairs
 *
 * type KeypairCred = BaseCred & {
 *   type: "keypair";
 *   privateKey: string;
 *   publicKey: string;
 * };
 ******************************************************************************/
export const createKeypairCred = async ({
  keyId,
  privateKey,
  publicKey,
}: {
  keyId: string;
  privateKey: string;
  publicKey: string;
}): Promise<KeypairCred> => {
  const timestamp = Date.now();

  return {
    id: parseInt(keyId, 16),
    version: CURRENT_VERSION,
    type: KEYPAIR_TYPE,
    timestamp,
    privateKey,
    publicKey,
  } as KeypairCred;
};

/*******************************************************************************
 * End of Keypairs
 ******************************************************************************/
