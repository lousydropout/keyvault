import {
  createKeypairCred,
  CURRENT_VERSION,
  decryptEntry,
  encryptEntries,
  isBaseCred,
  isKeypairCred,
  isPasswordCred,
  isValidCred,
  PasswordCred,
} from "@/utils/credentials";
import { generateKey } from "@/utils/encryption";
import { genKey } from "@/utils/openpgp";

describe("generation, encryption, and decryption of keypairs", async () => {
  const keypair = await genKey();
  const cred = await createKeypairCred(keypair);
  const encryptionKey = await generateKey();
  const incorrectKey = await generateKey();

  const encrypted = await encryptEntries(encryptionKey, [cred]);
  const decrypted = await decryptEntry(encryptionKey, encrypted);

  test("generated keypair cred should be recognized as a valid keypair cred", async () => {
    expect(isBaseCred(cred)).toBeTruthy();
    expect(isValidCred(cred)).toBeTruthy();
    expect(isKeypairCred(cred)).toBeTruthy();
  });

  test("generated keypair cred should be recoverable from decryption", async () => {
    expect(isKeypairCred(decrypted[0])).toBeTruthy();
    expect(decrypted).toEqual([cred]);
  });

  test("generated keypair cred should NOT be recoverable using a different key", async () => {
    await expect(decryptEntry(incorrectKey, encrypted)).rejects.toThrow();
  });

  describe("generation, encryption, and decryption of creds", async () => {
    const x: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("56f22adc", 16),
      type: 0,
      timestamp: 2,
      url: "https://example.com",
      username: "user1",
      password: "pass1-2",
      description: "Credential 1-2",
      isDeleted: false,
    };
    const keypair = await genKey();
    const cred = await createKeypairCred(keypair);

    const encryptionKey = await generateKey();
    const incorrectKey = await generateKey();

    const encrypted = await encryptEntries(encryptionKey, [cred, x]);
    const decrypted = await decryptEntry(encryptionKey, encrypted);

    test("generated keypair & password cred array should be recoverable from decryption", async () => {
      expect(isKeypairCred(decrypted[0])).toBeTruthy();
      expect(isPasswordCred(decrypted[1])).toBeTruthy();
      expect(decrypted).toEqual([cred, x]);
    });

    test("generated keypair & password cred array should be not recoverable using an invalid key", async () => {
      await expect(decryptEntry(incorrectKey, encrypted)).rejects.toThrow();
    });
  });
});
