import {
  convertToPasswordCred,
  createBarePasswordCred,
  isPasswordCred,
} from "@/utils/credentials";
import { decrypt, generateKey } from "@/utils/encryption";

const cred = createBarePasswordCred({
  url: "https://example.com",
  username: "example",
  password: "password",
  description: "example",
  curr: 10,
  prev: 3,
});

describe("Encryption", () => {
  it("decryption of ciphertext should return original plaintext", async () => {
    const key = await generateKey();
    const passwordCred = await convertToPasswordCred(key, cred);
    const unencrypted = JSON.parse(await decrypt(key, passwordCred.encrypted));

    console.log("passwordCred: ", passwordCred);
    console.log("isPasswordCred(passwordCred): ", isPasswordCred(passwordCred));
    console.log("unencrypted: ", unencrypted);

    expect(isPasswordCred(passwordCred)).toBeTruthy();
    expect(unencrypted).toEqual(cred);
  });

  it("iv should be length 16", async () => {
    const key = await generateKey();

    for (let i = 0; i < 100; i++) {
      const passwordCred = await convertToPasswordCred(key, cred);

      expect(passwordCred.encrypted.iv.length).toBe(16);
    }
  });
});
