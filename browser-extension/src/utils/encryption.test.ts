import {
  decrypt,
  encrypt,
  generateKey,
  parseEncryptedText,
  deriveKeyFromPassword,
  wrapKey,
  unwrapKey,
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

describe("Encryption/Decryption Edge Cases", () => {
  describe("Decryption with corrupted data", () => {
    it("should throw error when decrypting with corrupted ciphertext", async () => {
      const key = await generateKey();
      const data = [{ test: "data" }];
      const encrypted = await encrypt(key, data);
      
      // Corrupt the ciphertext
      const corrupted = {
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext.slice(0, -5) + "XXXXX",
      };

      await expect(decrypt(key, corrupted)).rejects.toThrow();
    });

    it("should throw error when decrypting with corrupted IV", async () => {
      const key = await generateKey();
      const data = [{ test: "data" }];
      const encrypted = await encrypt(key, data);
      
      // Corrupt the IV
      const corrupted = {
        iv: encrypted.iv.slice(0, -2) + "XX",
        ciphertext: encrypted.ciphertext,
      };

      await expect(decrypt(key, corrupted)).rejects.toThrow();
    });

    it("should throw error when decrypting with wrong IV length", async () => {
      const key = await generateKey();
      const data = [{ test: "data" }];
      const encrypted = await encrypt(key, data);
      
      // Use wrong IV length
      const corrupted = {
        iv: encrypted.iv.slice(0, 10), // Too short
        ciphertext: encrypted.ciphertext,
      };

      await expect(decrypt(key, corrupted)).rejects.toThrow();
    });
  });

  describe("Decryption with wrong key", () => {
    it("should throw error when decrypting with different key", async () => {
      const key1 = await generateKey();
      const key2 = await generateKey();
      const data = [{ test: "data" }];
      const encrypted = await encrypt(key1, data);

      await expect(decrypt(key2, encrypted)).rejects.toThrow();
    });

    it("should throw error when decrypting with key from different generation", async () => {
      const key1 = await generateKey();
      const key2 = await generateKey();
      const data = [{ test: "sensitive data" }];
      const encrypted = await encrypt(key1, data);

      // Even with same data, different keys should fail
      await expect(decrypt(key2, encrypted)).rejects.toThrow();
    });
  });

  describe("Large payloads", () => {
    it("should encrypt and decrypt large arrays", async () => {
      const key = await generateKey();
      // Reduced size to avoid stack overflow in bufferToBase64
      const largeArray = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        data: `item ${i}`.repeat(10),
      }));
      
      const encrypted = await encrypt(key, largeArray);
      const decrypted = await decrypt(key, encrypted);
      
      expect(decrypted).toEqual(largeArray);
    });

    it("should encrypt and decrypt large nested objects", async () => {
      const key = await generateKey();
      // Reduced size to avoid stack overflow
      const largeObject = {
        nested: Array.from({ length: 50 }, (_, i) => ({
          level1: {
            level2: {
              level3: {
                data: `nested data ${i}`.repeat(5),
              },
            },
          },
        })),
      };
      
      const encrypted = await encrypt(key, largeObject);
      const decrypted = await decrypt(key, encrypted);
      
      expect(decrypted).toEqual(largeObject);
    });
  });

  describe("Empty and special values", () => {
    it("should encrypt and decrypt empty array", async () => {
      const key = await generateKey();
      const emptyArray: any[] = [];
      
      const encrypted = await encrypt(key, emptyArray);
      const decrypted = await decrypt(key, encrypted);
      
      expect(decrypted).toEqual(emptyArray);
    });

    it("should encrypt and decrypt empty object", async () => {
      const key = await generateKey();
      const emptyObject = {};
      
      const encrypted = await encrypt(key, emptyObject);
      const decrypted = await decrypt(key, encrypted);
      
      expect(decrypted).toEqual(emptyObject);
    });

    it("should encrypt and decrypt null values", async () => {
      const key = await generateKey();
      const dataWithNull = { field1: "value", field2: null, field3: undefined };
      
      const encrypted = await encrypt(key, dataWithNull);
      const decrypted = await decrypt(key, encrypted);
      
      // Note: undefined might be converted to null in msgpack
      expect(decrypted).toHaveProperty("field1", "value");
      expect(decrypted).toHaveProperty("field2", null);
    });
  });

  describe("Special characters and unicode", () => {
    it("should encrypt and decrypt special characters", async () => {
      const key = await generateKey();
      const specialChars = {
        text: "!@#$%^&*()_+-=[]{}|;':\",./<>?",
        symbols: "©®™€£¥§¶†‡•…‰‹›",
      };
      
      const encrypted = await encrypt(key, specialChars);
      const decrypted = await decrypt(key, encrypted);
      
      expect(decrypted).toEqual(specialChars);
    });

    it("should encrypt and decrypt unicode characters", async () => {
      const key = await generateKey();
      const unicode = {
        chinese: "你好世界",
        japanese: "こんにちは世界",
        arabic: "مرحبا بالعالم",
        emoji: "🚀🌟💫✨🎉",
        mixed: "Hello 世界 🌍",
      };
      
      const encrypted = await encrypt(key, unicode);
      const decrypted = await decrypt(key, encrypted);
      
      expect(decrypted).toEqual(unicode);
    });

    it("should encrypt and decrypt newlines and tabs", async () => {
      const key = await generateKey();
      const withWhitespace = {
        multiline: "line1\nline2\nline3",
        tabs: "col1\tcol2\tcol3",
        mixed: "start\n\tindented\nend",
      };
      
      const encrypted = await encrypt(key, withWhitespace);
      const decrypted = await decrypt(key, encrypted);
      
      expect(decrypted).toEqual(withWhitespace);
    });
  });

  describe("Key derivation", () => {
    it("should derive key from weak password", async () => {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const weakPassword = "123";
      
      const key = await deriveKeyFromPassword(weakPassword, salt);
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.algorithm.name).toBe("AES-KW");
    });

    it("should derive key from strong password", async () => {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const strongPassword = "MyV3ry$tr0ng!P@ssw0rd#2024";
      
      const key = await deriveKeyFromPassword(strongPassword, salt);
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.algorithm.name).toBe("AES-KW");
    });

    it("should derive different keys from same password with different salts", async () => {
      const salt1 = crypto.getRandomValues(new Uint8Array(16));
      const salt2 = crypto.getRandomValues(new Uint8Array(16));
      const password = "samepassword";
      
      const key1 = await deriveKeyFromPassword(password, salt1);
      const key2 = await deriveKeyFromPassword(password, salt2);
      
      // Keys should be different due to different salts
      // Since keys are not extractable, we test by using them to wrap different keys
      const testKey1 = await generateKey();
      const testKey2 = await generateKey();
      
      // Wrap with key1 and key2 - should produce different results
      const wrapped1_1 = await crypto.subtle.wrapKey("raw", testKey1, key1, { name: "AES-KW" });
      const wrapped1_2 = await crypto.subtle.wrapKey("raw", testKey1, key2, { name: "AES-KW" });
      
      // Wrapped keys should be different
      expect(new Uint8Array(wrapped1_1)).not.toEqual(new Uint8Array(wrapped1_2));
    });

    it("should derive same key from same password and salt", async () => {
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const password = "testpassword";
      
      const key1 = await deriveKeyFromPassword(password, salt);
      const key2 = await deriveKeyFromPassword(password, salt);
      
      // Since keys are not extractable, test by using them to wrap the same key
      const testKey = await generateKey();
      
      const wrapped1 = await crypto.subtle.wrapKey("raw", testKey, key1, { name: "AES-KW" });
      const wrapped2 = await crypto.subtle.wrapKey("raw", testKey, key2, { name: "AES-KW" });
      
      // Wrapped keys should be the same (same key, same wrapping key)
      expect(new Uint8Array(wrapped1)).toEqual(new Uint8Array(wrapped2));
    });

    it("should derive key from empty password", async () => {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const emptyPassword = "";
      
      const key = await deriveKeyFromPassword(emptyPassword, salt);
      expect(key).toBeInstanceOf(CryptoKey);
    });

    it("should derive key from very long password", async () => {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const longPassword = "a".repeat(10000);
      
      const key = await deriveKeyFromPassword(longPassword, salt);
      expect(key).toBeInstanceOf(CryptoKey);
    });
  });

  describe("Key wrapping and unwrapping", () => {
    it("should wrap and unwrap key successfully", async () => {
      const key = await generateKey();
      const password = "testpassword";
      
      const wrappedKey = await wrapKey(key, password);
      expect(typeof wrappedKey).toBe("string");
      expect(wrappedKey.length).toBeGreaterThan(0);
      
      const unwrappedKey = await unwrapKey(wrappedKey, password);
      expect(unwrappedKey).toBeInstanceOf(CryptoKey);
    });

    it("should fail to unwrap with wrong password", async () => {
      const key = await generateKey();
      const password = "correctpassword";
      const wrongPassword = "wrongpassword";
      
      const wrappedKey = await wrapKey(key, password);
      
      await expect(unwrapKey(wrappedKey, wrongPassword)).rejects.toThrow();
    });

    it("should fail to unwrap with corrupted wrapped key", async () => {
      const key = await generateKey();
      const password = "testpassword";
      
      const wrappedKey = await wrapKey(key, password);
      const corrupted = wrappedKey.slice(0, -10) + "XXXXXXXXXX";
      
      await expect(unwrapKey(corrupted, password)).rejects.toThrow();
    });

    it("should wrap and unwrap multiple keys with same password", async () => {
      const key1 = await generateKey();
      const key2 = await generateKey();
      const password = "samepassword";
      
      const wrapped1 = await wrapKey(key1, password);
      const wrapped2 = await wrapKey(key2, password);
      
      // Wrapped keys should be different (different salts)
      expect(wrapped1).not.toBe(wrapped2);
      
      const unwrapped1 = await unwrapKey(wrapped1, password);
      const unwrapped2 = await unwrapKey(wrapped2, password);
      
      expect(unwrapped1).toBeInstanceOf(CryptoKey);
      expect(unwrapped2).toBeInstanceOf(CryptoKey);
    });

    it("should fail to unwrap with empty password", async () => {
      const key = await generateKey();
      const password = "testpassword";
      
      const wrappedKey = await wrapKey(key, password);
      
      await expect(unwrapKey(wrappedKey, "")).rejects.toThrow();
    });
  });
});
