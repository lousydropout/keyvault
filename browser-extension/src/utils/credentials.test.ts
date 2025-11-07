import {
  CURRENT_VERSION,
  getCredsByUrl,
  getMappingFromCredsByUrl,
  isPasswordCred,
  PASSWORD_TYPE,
  PasswordCred,
  passwordIndex,
  decryptEntry,
  decryptEntries,
  decryptAndCategorizeEntries,
  prunePendingCreds,
  isValidCred,
  isBaseCred,
  isKeypairCred,
  createNewPasswordCred,
  updatePasswordCred,
  deletePasswordCred,
  encryptEntries,
  updateWithNewPasswordCred,
  createKeypairCred,
  KEYPAIR_TYPE,
  CredsByUrl,
  CredsMapping,
} from "@/utils/credentials";
import { createKeyShortener } from "@/utils/utility";
import { generateKey } from "@/utils/encryption";

const w: PasswordCred = {
  version: CURRENT_VERSION,
  id: parseInt("56f22adc", 16),
  type: 0,
  timestamp: 1,
  url: "https://example.com",
  username: "user1",
  password: "pass1",
  description: "Credential 1",
  isDeleted: false,
};
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
const xDeleted: PasswordCred = {
  version: CURRENT_VERSION,
  type: 0,
  id: parseInt("56f22adc", 16),
  url: "https://example.com",
  timestamp: 3,
  isDeleted: true,
};
const y: PasswordCred = {
  version: CURRENT_VERSION,
  id: parseInt("4c9ccca3", 16),
  type: 0,
  timestamp: 4,
  url: "https://example.com",
  username: "user2",
  password: "pass2",
  description: "Credential 2",
  isDeleted: false,
};
const z: PasswordCred = {
  version: CURRENT_VERSION,
  id: parseInt("a3ed2683", 16),
  type: 0,
  timestamp: 14,
  url: "https://example.org",
  username: "user3",
  password: "pass3",
  description: "Credential 3",
  isDeleted: false,
};
const z2: PasswordCred = {
  version: CURRENT_VERSION,
  id: parseInt("a3ed2683", 16),
  type: 0,
  timestamp: 15,
  url: "https://example.com",
  username: "user3",
  password: "pass3-2",
  description: "Credential 3",
  isDeleted: false,
};

describe("Password credentials", () => {
  it.each([w, x, xDeleted, y, z])("should be a valid PasswordCred", (u) => {
    expect(isPasswordCred(u)).toBeTruthy();
  });

  it("should be NOT a valid PasswordCred if required fields are missing", () => {
    expect(isPasswordCred({})).toBeFalsy();
  });

  it("should shorten PasswordAdditionCred correctly", async () => {
    const wExpected = [
      CURRENT_VERSION, // version
      PASSWORD_TYPE, // type
      1458711260, // id
      1, // timestamp
      false, // isDeleted
      "https://example.com", // url
      "user1", // username
      "pass1", // password
      "Credential 1", // description
    ];

    const { recover, shorten } = createKeyShortener(passwordIndex);

    const shortened = shorten(w);
    expect(shortened).toEqual(wExpected);
    expect(shortened).not.toBeNull;

    if (shortened) {
      const recovered = recover(shortened);
      expect(recovered).toEqual(w);
    }
  });

  it("should shorten PasswordDeletionCred correctly", async () => {
    const xExpected = [
      CURRENT_VERSION,
      PASSWORD_TYPE,
      parseInt("56f22adc", 16), // id
      3, // timestamp
      true, // isDeleted
      "https://example.com", // url
    ];

    const { recover, shorten } = createKeyShortener(passwordIndex);

    const shortened = shorten(xDeleted);
    expect(shortened).toEqual(xExpected);
    expect(shortened).not.toBeNull;

    if (shortened) {
      const recovered = recover(shortened);
      expect(recovered).toEqual(xDeleted);
    }
  });
});

describe("Grouping credentials by URL", () => {
  // z.url === "https://example.org"
  // z2.url === "https://example.com"

  it("should have chains listed in chronological order within chain - 1", () => {
    const credsByUrl = getCredsByUrl([w, x, xDeleted, y, z, z2]);
    const mapping = getMappingFromCredsByUrl(credsByUrl);
    const expectedOutput = {
      "https://example.com": [[z, z2], [y], [w, x, xDeleted]],
    };

    expect(expectedOutput).toEqual(credsByUrl);
    expect(mapping).toEqual({
      [parseInt("a3ed2683", 16)]: ["https://example.com", 0],
      [parseInt("4c9ccca3", 16)]: ["https://example.com", 1],
      [parseInt("56f22adc", 16)]: ["https://example.com", 2],
    });
  });

  it("should have chains listed in chronological order within chain - 2", () => {
    const credsByUrl = getCredsByUrl([w, x, xDeleted, y, z]);
    const mapping = getMappingFromCredsByUrl(credsByUrl);

    const expectedOutput = {
      "https://example.com": [[y], [w, x, xDeleted]], // y was added later than xDeleted
      "https://example.org": [[z]],
    };
    expect(expectedOutput).toEqual(credsByUrl);
    expect(mapping).toEqual({
      [parseInt("a3ed2683", 16)]: ["https://example.org", 0],
      [parseInt("4c9ccca3", 16)]: ["https://example.com", 0],
      [parseInt("56f22adc", 16)]: ["https://example.com", 1],
    });
  });

  it("should have chains listed in chronological order within chain - 3", () => {
    const credsByUrl = getCredsByUrl([w, xDeleted, z2, x, y, z]);
    const mapping = getMappingFromCredsByUrl(credsByUrl);

    const expectedOutput = {
      "https://example.com": [[z, z2], [y], [w, x, xDeleted]], // z2 was added later than y
    };
    expect(expectedOutput).toEqual(credsByUrl);
    expect(mapping).toEqual({
      [parseInt("a3ed2683", 16)]: ["https://example.com", 0],
      [parseInt("4c9ccca3", 16)]: ["https://example.com", 1],
      [parseInt("56f22adc", 16)]: ["https://example.com", 2],
    });
  });
});

describe("Credential Chain Reconstruction - Edge Cases", () => {
  it("should handle empty array", () => {
    const credsByUrl = getCredsByUrl([]);
    expect(credsByUrl).toEqual({});
  });

  it("should handle single credential", () => {
    const singleCred: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("12345678", 16),
      type: 0,
      timestamp: 100,
      url: "https://single.com",
      username: "user",
      password: "pass",
      description: "Single",
      isDeleted: false,
    };
    const credsByUrl = getCredsByUrl([singleCred]);
    expect(credsByUrl).toEqual({
      "https://single.com": [[singleCred]],
    });
  });

  it("should handle credentials with same ID but different URLs (URL migration)", () => {
    const cred1: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("sameid123", 16),
      type: 0,
      timestamp: 1,
      url: "https://old-url.com",
      username: "user",
      password: "pass",
      description: "Old URL",
      isDeleted: false,
    };
    const cred2: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("sameid123", 16),
      type: 0,
      timestamp: 2,
      url: "https://new-url.com",
      username: "user",
      password: "pass",
      description: "New URL",
      isDeleted: false,
    };
    const credsByUrl = getCredsByUrl([cred1, cred2]);
    // Should use the URL from the latest timestamp (cred2)
    expect(credsByUrl).toEqual({
      "https://new-url.com": [[cred1, cred2]],
    });
  });

  it("should handle deleted credential at end of chain", () => {
    const active: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("deleted123", 16),
      type: 0,
      timestamp: 1,
      url: "https://example.com",
      username: "user",
      password: "pass",
      description: "Active",
      isDeleted: false,
    };
    const deleted: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("deleted123", 16),
      type: 0,
      timestamp: 2,
      url: "https://example.com",
      isDeleted: true,
    };
    const credsByUrl = getCredsByUrl([active, deleted]);
    expect(credsByUrl).toEqual({
      "https://example.com": [[active, deleted]],
    });
    // Chain should end with deleted credential
    expect(credsByUrl["https://example.com"][0][credsByUrl["https://example.com"][0].length - 1].isDeleted).toBe(true);
  });

  it("should handle multiple chains with same URL", () => {
    const chain1_1: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("c1a1n1", 16),
      type: 0,
      timestamp: 1,
      url: "https://same.com",
      username: "user1",
      password: "pass1",
      description: "Chain 1",
      isDeleted: false,
    };
    const chain1_2: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("c1a1n1", 16),
      type: 0,
      timestamp: 2,
      url: "https://same.com",
      username: "user1",
      password: "pass1-updated",
      description: "Chain 1 Updated",
      isDeleted: false,
    };
    const chain2_1: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("c2a2n2", 16),
      type: 0,
      timestamp: 3,
      url: "https://same.com",
      username: "user2",
      password: "pass2",
      description: "Chain 2",
      isDeleted: false,
    };
    const credsByUrl = getCredsByUrl([chain1_1, chain1_2, chain2_1]);
    // Chains should be sorted by latest timestamp (descending)
    expect(credsByUrl).toEqual({
      "https://same.com": [[chain2_1], [chain1_1, chain1_2]],
    });
  });

  it("should handle chain with multiple updates", () => {
    const v1: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("multiv1", 16),
      type: 0,
      timestamp: 1,
      url: "https://multi.com",
      username: "user",
      password: "pass1",
      description: "Version 1",
      isDeleted: false,
    };
    const v2: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("multiv1", 16),
      type: 0,
      timestamp: 2,
      url: "https://multi.com",
      username: "user",
      password: "pass2",
      description: "Version 2",
      isDeleted: false,
    };
    const v3: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("multiv1", 16),
      type: 0,
      timestamp: 3,
      url: "https://multi.com",
      username: "user",
      password: "pass3",
      description: "Version 3",
      isDeleted: false,
    };
    const credsByUrl = getCredsByUrl([v3, v1, v2]);
    // Should be sorted by timestamp within chain
    expect(credsByUrl).toEqual({
      "https://multi.com": [[v1, v2, v3]],
    });
    // Verify chronological order
    const chain = credsByUrl["https://multi.com"][0];
    expect(chain[0].timestamp).toBe(1);
    expect(chain[1].timestamp).toBe(2);
    expect(chain[2].timestamp).toBe(3);
  });

  it("should handle credentials with mixed types (only password creds are included)", () => {
    const passwordCred: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("password1", 16),
      type: 0,
      timestamp: 1,
      url: "https://example.com",
      username: "user",
      password: "pass",
      description: "Password",
      isDeleted: false,
    };
    const keypairCred = {
      version: CURRENT_VERSION,
      id: parseInt("keypair1", 16),
      type: 1,
      timestamp: 2,
      publicKey: "pubkey",
      privateKey: "privkey",
    };
    const credsByUrl = getCredsByUrl([passwordCred, keypairCred as any]);
    // Only password creds should be included
    expect(credsByUrl).toEqual({
      "https://example.com": [[passwordCred]],
    });
  });

  it("should handle chain where latest version is deleted", () => {
    const active: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("delchain", 16),
      type: 0,
      timestamp: 1,
      url: "https://example.com",
      username: "user",
      password: "pass",
      description: "Active",
      isDeleted: false,
    };
    const deleted: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("delchain", 16),
      type: 0,
      timestamp: 2,
      url: "https://example.com",
      isDeleted: true,
    };
    const credsByUrl = getCredsByUrl([active, deleted]);
    // URL should come from the latest version (deleted)
    expect(credsByUrl).toEqual({
      "https://example.com": [[active, deleted]],
    });
  });

  it("should sort chains by latest timestamp in descending order", () => {
    const oldChain: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("0ldc0de", 16),
      type: 0,
      timestamp: 1,
      url: "https://example.com",
      username: "old",
      password: "old",
      description: "Old",
      isDeleted: false,
    };
    const newChain: PasswordCred = {
      version: CURRENT_VERSION,
      id: parseInt("newc0de", 16),
      type: 0,
      timestamp: 10,
      url: "https://example.com",
      username: "new",
      password: "new",
      description: "New",
      isDeleted: false,
    };
    const credsByUrl = getCredsByUrl([oldChain, newChain]);
    // New chain should come first (latest timestamp)
    expect(credsByUrl["https://example.com"].length).toBe(2);
    expect(credsByUrl["https://example.com"][0][0].id).toBe(parseInt("newc0de", 16));
    expect(credsByUrl["https://example.com"][1][0].id).toBe(parseInt("0ldc0de", 16));
  });
});

describe("Error Scenarios", () => {
  describe("decryptEntry", () => {
    it("should return error result with invalid encrypted data", async () => {
      const key = await generateKey();
      const invalidEncrypted = {
        iv: "invalidiv1234", // Too short
        ciphertext: "corrupted",
      };

      const result = await decryptEntry(key, invalidEncrypted, 0);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.entryIndex).toBe(0);
        expect(result.encrypted).toEqual(invalidEncrypted);
      }
    });

    it("should return error result with wrong key", async () => {
      const key1 = await generateKey();
      const key2 = await generateKey();
      const data: PasswordCred = {
        version: CURRENT_VERSION,
        id: 123,
        type: 0,
        timestamp: Date.now(),
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "Test",
        isDeleted: false,
      };
      const encrypted = await encryptEntries(key1, [data]);

      const result = await decryptEntry(key2, encrypted, 1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.entryIndex).toBe(1);
      }
    });

    it("should return error result with corrupted ciphertext", async () => {
      const key = await generateKey();
      const data: PasswordCred = {
        version: CURRENT_VERSION,
        id: 123,
        type: 0,
        timestamp: Date.now(),
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "Test",
        isDeleted: false,
      };
      const encrypted = await encryptEntries(key, [data]);
      const corrupted = {
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext.slice(0, -5) + "XXXXX",
      };

      const result = await decryptEntry(key, corrupted, 2);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.entryIndex).toBe(2);
      }
    });

    it("should return error result with unrecognized version", async () => {
      const key = await generateKey();
      // Create encrypted data with wrong version by manually creating the shortened array
      const wrongVersionData = [[999, 0, 123, Date.now(), false, "url", "user", "pass", "desc"]];
      const { encrypt } = await import("@/utils/encryption");
      const encrypted = await encrypt(key, wrongVersionData);

      const result = await decryptEntry(key, encrypted, 3);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("unrecognized version");
      }
    });
  });

  describe("decryptEntries", () => {
    it("should handle partial failures (some succeed, some fail)", async () => {
      const key = await generateKey();
      const correctData: PasswordCred = {
        version: CURRENT_VERSION,
        id: 123,
        type: 0,
        timestamp: Date.now(),
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "Test",
        isDeleted: false,
      };

      const encrypted1 = await encryptEntries(key, [correctData]);
      const encrypted2 = await encryptEntries(key, [correctData]);
      const invalidEncrypted = {
        iv: "invalidiv1234",
        ciphertext: "corrupted",
      };

      const result = await decryptEntries(key, [encrypted1, invalidEncrypted, encrypted2]);

      // Should have some credentials and some errors
      expect(result.credentials.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].entryIndex).toBe(1);
    });

    it("should handle all failures", async () => {
      const key = await generateKey();
      const invalidEncrypted1 = {
        iv: "invalidiv1234",
        ciphertext: "corrupted1",
      };
      const invalidEncrypted2 = {
        iv: "invalidiv5678",
        ciphertext: "corrupted2",
      };

      const result = await decryptEntries(key, [invalidEncrypted1, invalidEncrypted2]);

      expect(result.credentials.length).toBe(0);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0].entryIndex).toBe(0);
      expect(result.errors[1].entryIndex).toBe(1);
    });

    it("should handle all successes", async () => {
      const key = await generateKey();
      const data: PasswordCred = {
        version: CURRENT_VERSION,
        id: 123,
        type: 0,
        timestamp: Date.now(),
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "Test",
        isDeleted: false,
      };

      const encrypted1 = await encryptEntries(key, [data]);
      const encrypted2 = await encryptEntries(key, [data]);

      const result = await decryptEntries(key, [encrypted1, encrypted2]);

      expect(result.credentials.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });

    it("should handle empty array", async () => {
      const key = await generateKey();
      const result = await decryptEntries(key, []);

      expect(result.credentials.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe("decryptAndCategorizeEntries", () => {
    it("should handle errors and still return categorized results", async () => {
      const key = await generateKey();
      const correctData: PasswordCred = {
        version: CURRENT_VERSION,
        id: 123,
        type: 0,
        timestamp: Date.now(),
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "Test",
        isDeleted: false,
      };

      const encrypted1 = await encryptEntries(key, [correctData]);
      const invalidEncrypted = {
        iv: "invalidiv1234",
        ciphertext: "corrupted",
      };

      const result = await decryptAndCategorizeEntries(key, [encrypted1, invalidEncrypted], []);

      // Should have passwords from successful decryption
      expect(Object.keys(result.passwords).length).toBeGreaterThan(0);
      // Should have errors from failed decryption
      expect(result.errors.length).toBe(1);
      expect(result.pendings.length).toBe(0);
    });

    it("should categorize credentials correctly", async () => {
      const key = await generateKey();
      const passwordCred: PasswordCred = {
        version: CURRENT_VERSION,
        id: 123,
        type: 0,
        timestamp: Date.now(),
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "Test",
        isDeleted: false,
      };

      const encrypted = await encryptEntries(key, [passwordCred]);
      const result = await decryptAndCategorizeEntries(key, [encrypted], []);

      expect(Object.keys(result.passwords).length).toBeGreaterThan(0);
      expect(result.keypairs.length).toBe(0);
      expect(result.secretShares.length).toBe(0);
      expect(result.contacts.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe("prunePendingCreds", () => {
    it("should remove pending creds that are on-chain", () => {
      const onChain: PasswordCred[] = [
        {
          version: CURRENT_VERSION,
          id: 1,
          type: 0,
          timestamp: 1,
          url: "https://example.com",
          username: "user1",
          password: "pass1",
          description: "On chain",
          isDeleted: false,
        },
        {
          version: CURRENT_VERSION,
          id: 2,
          type: 0,
          timestamp: 2,
          url: "https://example.com",
          username: "user2",
          password: "pass2",
          description: "On chain 2",
          isDeleted: false,
        },
      ];

      const pending: PasswordCred[] = [
        {
          version: CURRENT_VERSION,
          id: 1, // Same as on-chain
          type: 0,
          timestamp: 3,
          url: "https://example.com",
          username: "user1",
          password: "pass1-updated",
          description: "Pending",
          isDeleted: false,
        },
        {
          version: CURRENT_VERSION,
          id: 3, // Not on-chain
          type: 0,
          timestamp: 4,
          url: "https://example.com",
          username: "user3",
          password: "pass3",
          description: "Still pending",
          isDeleted: false,
        },
      ];

      const result = prunePendingCreds(onChain, pending);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(3);
    });

    it("should return all pending creds when none are on-chain", () => {
      const onChain: PasswordCred[] = [];
      const pending: PasswordCred[] = [
        {
          version: CURRENT_VERSION,
          id: 1,
          type: 0,
          timestamp: 1,
          url: "https://example.com",
          username: "user",
          password: "pass",
          description: "Pending",
          isDeleted: false,
        },
      ];

      const result = prunePendingCreds(onChain, pending);
      expect(result.length).toBe(1);
      expect(result).toEqual(pending);
    });

    it("should return empty array when all pending are on-chain", () => {
      const onChain: PasswordCred[] = [
        {
          version: CURRENT_VERSION,
          id: 1,
          type: 0,
          timestamp: 1,
          url: "https://example.com",
          username: "user",
          password: "pass",
          description: "On chain",
          isDeleted: false,
        },
      ];

      const pending: PasswordCred[] = [
        {
          version: CURRENT_VERSION,
          id: 1,
          type: 0,
          timestamp: 2,
          url: "https://example.com",
          username: "user",
          password: "pass-updated",
          description: "Pending",
          isDeleted: false,
        },
      ];

      const result = prunePendingCreds(onChain, pending);
      expect(result.length).toBe(0);
    });

    it("should handle empty arrays", () => {
      const result = prunePendingCreds([], []);
      expect(result.length).toBe(0);
    });
  });

  describe("Credential validation", () => {
    it("should reject invalid base credential", () => {
      expect(isBaseCred({})).toBe(false);
      expect(isBaseCred(null)).toBe(false);
      expect(isBaseCred(undefined)).toBe(false);
      expect(isBaseCred({ type: 0 })).toBe(false); // Missing id and timestamp
      expect(isBaseCred({ id: 123 })).toBe(false); // Missing type and timestamp
    });

    it("should reject invalid password credential", () => {
      expect(isPasswordCred({})).toBe(false);
      expect(isPasswordCred({ version: 1, id: 123, type: 0, timestamp: 1 })).toBe(false); // Missing required fields
      expect(isPasswordCred({ version: 1, id: 123, type: 1, timestamp: 1 })).toBe(false); // Wrong type
    });

    it("should reject invalid keypair credential", () => {
      expect(isKeypairCred({})).toBe(false);
      expect(isKeypairCred({ version: 1, id: 123, type: 0, timestamp: 1 })).toBe(false); // Wrong type
      expect(isKeypairCred({ version: 1, id: 123, type: 1 })).toBe(false); // Missing fields
    });

    it("should reject invalid credential", () => {
      expect(isValidCred({})).toBe(false);
      expect(isValidCred(null)).toBe(false);
      expect(isValidCred({ version: 1, id: 123, type: 999, timestamp: 1 })).toBe(false); // Invalid type
    });
});

describe("Credential Lifecycle Functions", () => {
  describe("createNewPasswordCred", () => {
    it("should create new password credential with all parameters", () => {
      const params = {
        url: "https://example.com",
        username: "testuser",
        password: "testpass",
        description: "Test credential",
      };

      const cred = createNewPasswordCred(params);

      expect(cred.version).toBe(CURRENT_VERSION);
      expect(cred.type).toBe(PASSWORD_TYPE);
      expect(cred.isDeleted).toBe(false);
      expect(cred.url).toBe(params.url);
      expect(cred.username).toBe(params.username);
      expect(cred.password).toBe(params.password);
      expect(cred.description).toBe(params.description);
      expect(typeof cred.id).toBe("number");
      expect(typeof cred.timestamp).toBe("number");
      expect(cred.timestamp).toBeGreaterThan(0);
    });

    it("should generate unique IDs for different credentials", () => {
      const params = {
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "Test",
      };

      const cred1 = createNewPasswordCred(params);
      const cred2 = createNewPasswordCred(params);

      // IDs should be different (very high probability)
      expect(cred1.id).not.toBe(cred2.id);
    });

    it("should create credentials with empty strings", () => {
      const params = {
        url: "",
        username: "",
        password: "",
        description: "",
      };

      const cred = createNewPasswordCred(params);

      expect(cred.url).toBe("");
      expect(cred.username).toBe("");
      expect(cred.password).toBe("");
      expect(cred.description).toBe("");
    });

    it("should create credentials with special characters", () => {
      const params = {
        url: "https://example.com/path?query=1",
        username: "user@example.com",
        password: "p@ssw0rd!",
        description: "Test & Description",
      };

      const cred = createNewPasswordCred(params);

      expect(cred.url).toBe(params.url);
      expect(cred.username).toBe(params.username);
      expect(cred.password).toBe(params.password);
      expect(cred.description).toBe(params.description);
    });
  });

  describe("updatePasswordCred", () => {
    it("should preserve ID and update timestamp", () => {
      const original: PasswordCred = {
        version: CURRENT_VERSION,
        id: 12345,
        type: 0,
        timestamp: 1000,
        url: "https://old.com",
        username: "olduser",
        password: "oldpass",
        description: "Old desc",
        isDeleted: false,
      };

      const updated = updatePasswordCred(original, {
        password: "newpass",
      });

      expect(updated.id).toBe(original.id);
      expect(updated.timestamp).toBeGreaterThan(original.timestamp);
      expect(updated.url).toBe(original.url);
      expect(updated.username).toBe(original.username);
      expect(updated.password).toBe("newpass");
      expect(updated.description).toBe(original.description);
    });

    it("should update all fields when provided", () => {
      const original: PasswordCred = {
        version: CURRENT_VERSION,
        id: 12345,
        type: 0,
        timestamp: 1000,
        url: "https://old.com",
        username: "olduser",
        password: "oldpass",
        description: "Old desc",
        isDeleted: false,
      };

      const updated = updatePasswordCred(original, {
        url: "https://new.com",
        username: "newuser",
        password: "newpass",
        description: "New desc",
      });

      expect(updated.url).toBe("https://new.com");
      expect(updated.username).toBe("newuser");
      expect(updated.password).toBe("newpass");
      expect(updated.description).toBe("New desc");
      expect(updated.id).toBe(original.id);
    });

    it("should update partial fields", () => {
      const original: PasswordCred = {
        version: CURRENT_VERSION,
        id: 12345,
        type: 0,
        timestamp: 1000,
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "desc",
        isDeleted: false,
      };

      const updated = updatePasswordCred(original, {
        username: "newuser",
      });

      expect(updated.username).toBe("newuser");
      expect(updated.url).toBe(original.url);
      expect(updated.password).toBe(original.password);
      expect(updated.description).toBe(original.description);
    });
  });

  describe("deletePasswordCred", () => {
    it("should create deletion marker with same ID", () => {
      const original: PasswordCred = {
        version: CURRENT_VERSION,
        id: 12345,
        type: 0,
        timestamp: 1000,
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "desc",
        isDeleted: false,
      };

      const deleted = deletePasswordCred(original);

      expect(deleted.id).toBe(original.id);
      expect(deleted.url).toBe(original.url);
      expect(deleted.isDeleted).toBe(true);
      expect(deleted.timestamp).toBeGreaterThan(original.timestamp);
      expect(deleted.version).toBe(CURRENT_VERSION);
      expect(deleted.type).toBe(PASSWORD_TYPE);
      // Deletion cred should not have username, password, description
      expect("username" in deleted).toBe(false);
      expect("password" in deleted).toBe(false);
      expect("description" in deleted).toBe(false);
    });

    it("should preserve URL in deletion marker", () => {
      const original: PasswordCred = {
        version: CURRENT_VERSION,
        id: 12345,
        type: 0,
        timestamp: 1000,
        url: "https://example.com/path",
        username: "user",
        password: "pass",
        description: "desc",
        isDeleted: false,
      };

      const deleted = deletePasswordCred(original);

      expect(deleted.url).toBe("https://example.com/path");
    });
  });

  describe("updateWithNewPasswordCred", () => {
    it("should add new credential to empty record", () => {
      const cred: PasswordCred = {
        version: CURRENT_VERSION,
        id: 123,
        type: 0,
        timestamp: 1000,
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "desc",
        isDeleted: false,
      };

      const record: CredsByUrl = {};
      const mapping: CredsMapping = {};

      const result = updateWithNewPasswordCred(cred, record, mapping);

      expect(result.record["https://example.com"]).toBeDefined();
      expect(result.record["https://example.com"][0][0]).toEqual(cred);
      expect(result.mapping[123]).toEqual(["https://example.com", 0]);
    });

    it("should update existing credential in record", () => {
      const original: PasswordCred = {
        version: CURRENT_VERSION,
        id: 123,
        type: 0,
        timestamp: 1000,
        url: "https://example.com",
        username: "user",
        password: "pass",
        description: "desc",
        isDeleted: false,
      };

      const updated: PasswordCred = {
        version: CURRENT_VERSION,
        id: 123,
        type: 0,
        timestamp: 2000,
        url: "https://example.com",
        username: "newuser",
        password: "newpass",
        description: "newdesc",
        isDeleted: false,
      };

      const record: CredsByUrl = {
        "https://example.com": [[original]],
      };
      const mapping: CredsMapping = {
        123: ["https://example.com", 0],
      };

      const result = updateWithNewPasswordCred(updated, record, mapping);

      const chain = result.record["https://example.com"][0];
      expect(chain.length).toBe(2);
      expect(chain[0]).toEqual(original);
      expect(chain[1]).toEqual(updated);
    });

    it("should throw error for non-password credential", () => {
      const keypairCred = {
        version: CURRENT_VERSION,
        id: 123,
        type: 1,
        timestamp: 1000,
        publicKey: "pubkey",
        privateKey: "privkey",
      };

      const record: CredsByUrl = {};
      const mapping: CredsMapping = {};

      expect(() => {
        updateWithNewPasswordCred(keypairCred as any, record, mapping);
      }).toThrow("Invalid Password Cred");
    });
  });

  describe("createKeypairCred", () => {
    it("should create keypair credential from OpenPGP key", async () => {
      const { genKey } = await import("@/utils/openpgp");
      const keypair = await genKey();
      const cred = await createKeypairCred(keypair);

      expect(cred.version).toBe(CURRENT_VERSION);
      expect(cred.type).toBe(KEYPAIR_TYPE);
      expect(typeof cred.id).toBe("number");
      expect(typeof cred.timestamp).toBe("number");
      expect(typeof cred.publicKey).toBe("string");
      expect(typeof cred.privateKey).toBe("string");
      expect(cred.publicKey.length).toBeGreaterThan(0);
      expect(cred.privateKey.length).toBeGreaterThan(0);
    });

    it("should generate unique IDs for different keypairs", async () => {
      const { genKey } = await import("@/utils/openpgp");
      const keypair1 = await genKey();
      const keypair2 = await genKey();

      const cred1 = await createKeypairCred(keypair1);
      const cred2 = await createKeypairCred(keypair2);

      expect(cred1.id).not.toBe(cred2.id);
    });
  });
});
});
