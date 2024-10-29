import { decrypt, encrypt, generateKey } from "@/utils/encryption";

describe("Encryption", () => {
  it("decryption of ciphertext should return original object", async () => {
    const key = await generateKey();
    const x = [{ name: "john doe", age: 3 }];
    const secret = await encrypt(key, x);
    expect(secret.iv.length).toBe(16);

    const plainObj = await decrypt(key, secret);
    expect(plainObj).toEqual(x);
  });
});
