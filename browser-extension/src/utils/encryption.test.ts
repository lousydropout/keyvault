import {
  decrypt,
  encrypt,
  generateKey,
  parseEncryptedText,
} from "@/utils/encryption";

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

describe("parseEncryptedText", () => {
  describe("Valid inputs", () => {
    it("should parse valid encrypted text with 16-char IV and ciphertext", () => {
      // Create a valid encrypted text: 16-char IV + ciphertext
      const iv = "abcdefghijklmnop"; // 16 characters
      const ciphertext = "someciphertext";
      const encryptedText = iv + ciphertext;

      const result = parseEncryptedText(encryptedText);

      expect(result.iv).toBe(iv);
      expect(result.iv.length).toBe(16);
      expect(result.ciphertext).toBe(ciphertext);
    });

    it("should parse encrypted text from encrypt function", async () => {
      const key = await generateKey();
      const data = [{ test: "data" }];
      const encrypted = await encrypt(key, data);

      // Combine IV and ciphertext as they would be stored
      const encryptedText = encrypted.iv + encrypted.ciphertext;
      const parsed = parseEncryptedText(encryptedText);

      expect(parsed.iv).toBe(encrypted.iv);
      expect(parsed.iv.length).toBe(16);
      expect(parsed.ciphertext).toBe(encrypted.ciphertext);
    });

    it("should handle exactly 16 characters (IV only, empty ciphertext)", () => {
      const iv = "abcdefghijklmnop"; // exactly 16 characters
      const encryptedText = iv;

      const result = parseEncryptedText(encryptedText);

      expect(result.iv).toBe(iv);
      expect(result.iv.length).toBe(16);
      expect(result.ciphertext).toBe("");
    });
  });

  describe("Invalid inputs", () => {
    it("should throw error for empty string", () => {
      expect(() => parseEncryptedText("")).toThrow(
        "Encrypted text cannot be empty"
      );
    });

    it("should throw error for string shorter than 16 characters", () => {
      const shortText = "short"; // 5 characters
      expect(() => parseEncryptedText(shortText)).toThrow(
        `Encrypted text is too short (must be at least 16 characters for IV, got ${shortText.length})`
      );
    });

    it("should throw error for 15-character string", () => {
      const shortText = "abcdefghijklmno"; // 15 characters
      expect(() => parseEncryptedText(shortText)).toThrow(
        `Encrypted text is too short (must be at least 16 characters for IV, got ${shortText.length})`
      );
    });
  });

  describe("Edge cases", () => {
    it("should parse correctly with valid base64 IV and long ciphertext", () => {
      const iv = "YWJjZGVmZ2hpams="; // 16-char base64 string
      const ciphertext = "verylongciphertextthatgoesonandon";
      const encryptedText = iv + ciphertext;

      const result = parseEncryptedText(encryptedText);

      expect(result.iv).toBe(iv);
      expect(result.iv.length).toBe(16);
      expect(result.ciphertext).toBe(ciphertext);
    });

    it("should handle strings with exactly 16 characters", () => {
      const exactly16 = "1234567890123456"; // exactly 16 characters
      const result = parseEncryptedText(exactly16);

      expect(result.iv).toBe(exactly16);
      expect(result.iv.length).toBe(16);
      expect(result.ciphertext).toBe("");
    });
  });
});
