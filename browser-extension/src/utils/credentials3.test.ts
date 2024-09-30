import {
  createKeypairCred,
  decryptEntry,
  isBaseCred,
  isKeypairCred,
  isValidCred,
} from "@/utils/credentials";
import { generateKey } from "@/utils/encryption";
import { genKey } from "@/utils/openpgp";

describe("Tests regarding ", () => {
  test("generated keypair cred should be recognized as a valid keypair cred", async () => {
    const encryptionKey = await generateKey();

    const keypair = await genKey();
    const cred = await createKeypairCred(encryptionKey, keypair, 0, -1);

    expect(isBaseCred(cred)).toBe(true);
    expect(isValidCred(cred)).toBe(true);
    expect(isKeypairCred(cred)).toBe(true);
  });

  test("generated keypair cred should be recoverable from decryption", async () => {
    const encryptionKey = await generateKey();

    const keypair = await genKey();
    const cred = await createKeypairCred(encryptionKey, keypair, 0, -1);

    const decrypted = await decryptEntry(encryptionKey, cred.encrypted);

    expect(isKeypairCred(decrypted)).toBe(true);
    expect(decrypted).toEqual(cred);
  });

  test("generated keypair cred should NOT be recoverable using a different key", async () => {
    const encryptionKey = await generateKey();
    const incorrectKey = await generateKey();

    const keypair = await genKey();
    const cred = await createKeypairCred(encryptionKey, keypair, 0, -1);

    const decrypted = await decryptEntry(incorrectKey, cred.encrypted);

    expect(isValidCred(decrypted)).toBe(false);
    expect(isKeypairCred(decrypted)).toBe(false);
  });
});
