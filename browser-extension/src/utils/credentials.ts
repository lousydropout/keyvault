import { Encrypted, decrypt, encrypt } from "./encryption";

export interface Cred {
  prev: number;
  url: string;
  username: string;
  password: string;
  description?: string;
  onChain?: boolean;
  ciphertext?: Encrypted;
  timestamp?: string;
  curr?: number;
  next?: number;
  isDeleted?: boolean;
}

export interface IndexedEntries {
  [key: string]: Cred;
}

export async function encryptCred(
  cryptoKey: CryptoKey,
  entry: Cred
): Promise<Cred> {
  const plaintext = JSON.stringify({
    url: entry.url,
    username: entry.username,
    password: entry.password,
    description: entry.description || "",
    prev: entry.prev,
    timestamp: entry.timestamp || new Date().toISOString(),
  });
  return {
    ...entry,
    ciphertext: await encrypt(cryptoKey, plaintext),
  };
}

export async function addEntry(
  cryptoKey: CryptoKey,
  entries: Cred[],
  entry: Cred
): Promise<Cred[]> {
  const newEntry = {
    ...entry,
    curr: entries.length,
    timestamp: new Date().toISOString(),
  };
  entries.push({
    ...(await encryptCred(cryptoKey, newEntry)),
    onChain: false,
    next: -1,
  });
  return entries;
}

export async function modifyEntry(
  cryptoKey: CryptoKey,
  entries: Cred[],
  entry: Cred
): Promise<Cred[]> {
  entries.push({
    ...(await encryptCred(cryptoKey, entry)),
    onChain: false,
    curr: entries.length,
    next: -1,
  });
  return entries;
}

export async function deleteEntry(
  cryptoKey: CryptoKey,
  entries: Cred[],
  k: number
): Promise<Cred[]> {
  const entry = entries[k];
  entry.prev = entry.curr as number;
  entry.isDeleted = true;

  entries.push({
    ...(await encryptCred(cryptoKey, entry)),
    onChain: false,
    curr: entries.length,
    timestamp: new Date().toISOString(),
    next: -1,
  });

  return entries;
}

export function checkIfValid(entries: Cred[]) {
  const seen = new Set<number>();

  for (const entry of entries) {
    if (entry.prev === -1) continue;
    if (seen.has(entry.prev)) return false;
    seen.add(entry.prev);
  }
  return true;
}

export function getSuccessors(entries: Cred[]): number[] {
  const result = [];
  for (let i = 0; i < entries.length; i++) {
    result.push(-1);
    if (entries[i].prev > -1) result[entries[i].prev] = i;
  }
  return result;
}

function hash(entry: Cred): string {
  return JSON.stringify({
    url: entry.url,
    username: entry.username,
    password: entry.password,
  });
}

export async function merge(source: Cred[], onChain: Cred[]): Promise<Cred[]> {
  const result = source.filter((entry) => entry.onChain);
  // assert that result contains only onChain entries
  if (
    source.slice(0, result.length).filter((entry) => !entry.onChain).length > 0
  ) {
    throw new Error(
      "Assertion error: onChain entry exists after offChain entry. " +
        "Cannot merge with onChain entries"
    );
  }
  // assert that  entries not in result contain only offChain entries
  if (
    source.slice(result.length).filter((entry) => !entry.onChain).length > 0
  ) {
    throw new Error(
      "Assertion error: onChain entry exists after offChain entry. " +
        "Cannot merge with onChain entries"
    );
  }
  // assert that elements in result are the same as elements in onChain
  for (let i = 0; i < result.length; i++) {
    if (
      result[i].prev !== onChain[i].prev ||
      result[i].url !== onChain[i].url ||
      result[i].username !== onChain[i].username ||
      result[i].password !== onChain[i].password
    ) {
      throw new Error(
        `Assertion error: mismatch between onChain and offChain entries at index ${i}: (` +
          `onChain: ${JSON.stringify(onChain[i])}, ` +
          `offChain: ${JSON.stringify(result[i])})`
      );
    }
  }

  const last = result.length;
  const successors = getSuccessors(source);

  // set of "hashes" of not-yet-on-chain entries
  const newEntries = new Set<string>(
    source
      .slice(last)
      .filter((entry) => entry.prev === -1)
      .map((entry) => hash(entry))
  );

  // add entries to result array
  function addEntriesToResult(entries: Cred[], onChain: boolean) {
    entries.slice(last).forEach((entry, k) => {
      result.push({ ...entry, onChain });
      newEntries.delete(hash(entry)); // remove from newEntries if it exists there

      // update successor
      const found = source
        .slice(last)
        .filter((sourceEntry) => sourceEntry.prev == entry.prev);
      if (found.length > 0) source[successors[found[0].prev]].prev = k;
    });
  }

  addEntriesToResult(onChain, true); // add onChain entries
  addEntriesToResult(source, false); // add source entries

  return result;
}

function organizeIntoChains(entries: Cred[]): Cred[][] {
  // Step 1: Initialize chains
  const chains: Cred[][] = [];

  // Step 2: Track which indices have been processed
  const seen = new Set();

  // Step 3: Iterate through the array
  entries.forEach((obj) => {
    if (obj.prev === -1 && !seen.has(obj.curr)) {
      const chain = [];
      let current: Cred | null = obj;

      // Follow the revisions chain using direct indexing
      while (current) {
        chain.push(current);
        seen.add(current.curr);
        current =
          current.prev !== -1 && !seen.has(current.prev)
            ? entries[current.prev]
            : null;
      }

      // Add the completed chain to the chains list
      chains.push(chain);
    }
  });
  return chains;
}

export function getEntriesByURL(entries: Cred[]): Record<string, Cred[][]> {
  const results: Record<string, Cred[][]> = {};

  organizeIntoChains(entries).forEach((chain) => {
    if (!results[chain[0].url]) {
      results[chain[0].url] = [];
    }
    results[chain[0].url].push(chain);
  });

  return results;
}

export function getCredsByURL(entries: Cred[]): Record<string, Cred[]> {
  const successors = getSuccessors(entries);
  const results: Record<string, Cred[]> = {};

  entries
    .map((entry, k) => ({ ...entry, curr: k }))
    .filter((_, k) => successors[k] === -1)
    .forEach((entry) => {
      if (!results[entry.url]) {
        results[entry.url] = [];
      }
      results[entry.url].push(entry);
    });

  return results;
}

export async function decryptEntry(
  cryptoKey: CryptoKey,
  encryptedEntry: Encrypted
): Promise<Cred> {
  return {
    ...JSON.parse(await decrypt(cryptoKey, encryptedEntry)),
    ciphertext: encryptedEntry,
  };
}
