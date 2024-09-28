import {
  addNext,
  createBarePasswordCred,
  Cred,
  decryptEntries,
  deleteK,
  deleteMultiOptimized,
  isValidCred,
  markForDeletion,
  merge,
  ValidCred,
} from "@/utils/credentials";
import { encrypt, Encrypted, generateKey } from "@/utils/encryption";

const key = await generateKey();

let idx = 0;
const createPassword = async (
  prev: number,
  onChain: boolean,
  timestamp: string
): Promise<Encrypted> => {
  const baseCred = createBarePasswordCred({
    url: "https://example.com",
    username: "user",
    password: "password",
    description: "example",
    curr: idx++,
    prev,
  });
  baseCred.timestamp = timestamp;

  return encrypt(key, baseCred, onChain);
};

// Test data for testing merging
const onChainEncrypteds = [
  await createPassword(-1, true, "1"),
  await createPassword(-1, true, "2"),
  await createPassword(0, true, "3"),
  await createPassword(2, true, "6"),
];

const currEncrypteds = [
  onChainEncrypteds[0],
  onChainEncrypteds[1],
  await createPassword(1, false, "4"),
  await createPassword(0, false, "5"),
  await createPassword(3, false, "7"),
  await createPassword(2, false, "8"),
];

const expected = [
  await createPassword(-1, true, "1"), // 0
  await createPassword(-1, true, "2"), // 1
  await createPassword(0, true, "3"), // 2
  await createPassword(2, true, "6"), // 3
  await createPassword(1, false, "4"), // 4
  await createPassword(3, false, "7"), // 5
  await createPassword(4, false, "8"), // 6
];

const expectedWithOoo = [
  await createPassword(-1, true, "1"), // 0
  await createPassword(-1, true, "2"), // 1
  await createPassword(0, true, "3"), // 2
  await createPassword(2, true, "6"), // 3
  await createPassword(1, false, "4"), // 4
  await createPassword(3, false, "5"), // 5
  await createPassword(5, false, "7"), // 6
  await createPassword(4, false, "8"), // 7
];

// Test data for testing deletion
idx = 0;
const encrypteds = [
  await createPassword(-1, false, "0"),
  await createPassword(0, false, "1"),
  await createPassword(1, false, "2"),
  await createPassword(-1, false, "3"),
  await createPassword(2, false, "4"),
  await createPassword(3, false, "5"),
  await createPassword(4, false, "6"),
];
const creds = await decryptEntries(key, encrypteds);

const getFields = (cred: Cred) => {
  return isValidCred(cred)
    ? {
        prev: cred.prev,
        onChain: cred.encrypted.onChain,
        timestamp: cred.timestamp,
      }
    : {};
};

describe("Deleting creds", () => {
  it("should be the same if via deleteMultiOptimized and repeated deleteK", async () => {
    for (let i = 0; i < 2 ** creds.length - 1; i++) {
      const toBeDeleted = i
        .toString(2)
        .padStart(creds.length, "0")
        .split("")
        .map((c) => c === "1");
      const toBeDeleteds = toBeDeleted
        .map((b, i) => (b ? i : -1))
        .filter((i) => i !== -1);
      let expected = structuredClone(creds) as ValidCred[];
      toBeDeleteds.reverse().forEach((k) => {
        expected = deleteK(expected, k);
      });

      const output = deleteMultiOptimized(creds as ValidCred[], toBeDeleted);

      expect(expected.map(getFields)).toEqual(output.map(getFields));
    }
  });
});

describe("Merging", () => {
  it("should be able to merge mixed onchain and offchain encrypteds if out-of-order creds are okay", async () => {
    const mergedEncrypteds = await merge(
      key,
      onChainEncrypteds,
      currEncrypteds,
      false // don't delete out-of-order creds
    );
    const mergedCreds = await decryptEntries(key, mergedEncrypteds);

    const expectedCreds = await decryptEntries(key, expectedWithOoo);

    expect(expectedCreds.map(getFields)).toEqual(mergedCreds.map(getFields));

    // Cred 5 is out of order, so it should be marked for deletion
    const expectedMarkForDeletion = mergedCreds.map((_, i) => i === 5);

    expect(expectedMarkForDeletion).toEqual(
      markForDeletion(addNext(mergedCreds as ValidCred[]))
    );
  });

  it("should be able to merge mixed onchain and offchain encrypteds", async () => {
    const mergedEncrypteds = await merge(
      key,
      onChainEncrypteds,
      currEncrypteds,
      true // do delete out-of-order creds
    );
    const mergedCreds = await decryptEntries(key, mergedEncrypteds);

    const expectedCreds = await decryptEntries(key, expected);

    expect(expectedCreds.map(getFields)).toEqual(mergedCreds.map(getFields));
  });
});
