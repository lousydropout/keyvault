import { describe, it, expect } from "bun:test";
import {
  escapeCSVField,
  credentialsToCSV,
  credentialsToEncryptedCSV,
  parseCSV,
  parseCSVRow,
  isEncryptedCSV,
  decryptAndParseCSV,
  mergeImportedCredentials,
  validateCSVHeader,
} from "@/utils/csv";
import { CURRENT_VERSION, PASSWORD_TYPE, PasswordAdditionCred } from "@/utils/credentials";
import { generateKey, decrypt } from "@/utils/encryption";

const createPasswordCred = (
  overrides: Partial<PasswordAdditionCred> = {}
): PasswordAdditionCred => ({
  version: CURRENT_VERSION,
  type: PASSWORD_TYPE,
  id: Math.floor(Math.random() * 1000000),
  timestamp: Date.now(),
  isDeleted: false,
  url: "https://example.com",
  username: "testuser",
  password: "testpass",
  description: "Test Site",
  ...overrides,
});

describe("CSV Export", () => {
  describe("CSV format matches expected header", () => {
    it("should produce CSV with correct header: name,url,username,password,note", () => {
      const credentials = [createPasswordCred()];
      const csv = credentialsToCSV(credentials);
      const lines = csv.split("\n");

      expect(lines[0]).toBe("name,url,username,password,note");
    });

    it("should include credential data in correct column order", () => {
      const cred = createPasswordCred({
        description: "My Site",
        url: "https://mysite.com",
        username: "myuser",
        password: "mypass",
      });

      const csv = credentialsToCSV([cred]);
      const lines = csv.split("\n");

      expect(lines[1]).toBe("My Site,https://mysite.com,myuser,mypass,My Site");
    });

    it("should handle empty credentials array", () => {
      const csv = credentialsToCSV([]);
      expect(csv).toBe("name,url,username,password,note");
    });

    it("should handle multiple credentials", () => {
      const creds = [
        createPasswordCred({
          description: "Site A",
          url: "https://a.com",
          username: "userA",
          password: "passA",
        }),
        createPasswordCred({
          description: "Site B",
          url: "https://b.com",
          username: "userB",
          password: "passB",
        }),
      ];

      const csv = credentialsToCSV(creds);
      const lines = csv.split("\n");

      expect(lines.length).toBe(3);
      expect(lines[1]).toBe("Site A,https://a.com,userA,passA,Site A");
      expect(lines[2]).toBe("Site B,https://b.com,userB,passB,Site B");
    });
  });

  describe("proper escaping of special characters (RFC 4180)", () => {
    it("should escape fields containing commas", () => {
      const escaped = escapeCSVField("hello, world");
      expect(escaped).toBe('"hello, world"');
    });

    it("should escape fields containing double quotes by doubling them", () => {
      const escaped = escapeCSVField('say "hello"');
      expect(escaped).toBe('"say ""hello"""');
    });

    it("should escape fields containing newlines", () => {
      const escaped = escapeCSVField("line1\nline2");
      expect(escaped).toBe('"line1\nline2"');
    });

    it("should escape fields containing carriage returns", () => {
      const escaped = escapeCSVField("line1\rline2");
      expect(escaped).toBe('"line1\rline2"');
    });

    it("should handle fields with multiple special characters", () => {
      const escaped = escapeCSVField('hello, "world"\nnewline');
      expect(escaped).toBe('"hello, ""world""\nnewline"');
    });

    it("should not escape normal fields", () => {
      const escaped = escapeCSVField("normal text");
      expect(escaped).toBe("normal text");
    });

    it("should handle null/undefined values", () => {
      expect(escapeCSVField(null as any)).toBe("");
      expect(escapeCSVField(undefined as any)).toBe("");
    });

    it("should properly escape credentials with special characters", () => {
      const cred = createPasswordCred({
        description: 'Site, with "quotes"',
        url: "https://example.com/path?a=1&b=2",
        username: "user@example.com",
        password: "p@ss,word",
      });

      const csv = credentialsToCSV([cred]);
      const lines = csv.split("\n");

      expect(lines[1]).toContain('"Site, with ""quotes"""');
      expect(lines[1]).toContain('"p@ss,word"');
    });
  });

  describe("encrypted export produces encrypted file", () => {
    it("should encrypt CSV content", async () => {
      const key = await generateKey();
      const creds = [
        createPasswordCred({
          description: "Test Site",
          url: "https://test.com",
          username: "testuser",
          password: "secretpass",
        }),
      ];

      const encrypted = await credentialsToEncryptedCSV(key, creds);

      expect(encrypted).toHaveProperty("iv");
      expect(encrypted).toHaveProperty("ciphertext");
      expect(typeof encrypted.iv).toBe("string");
      expect(typeof encrypted.ciphertext).toBe("string");
      expect(encrypted.ciphertext.length).toBeGreaterThan(0);
    });

    it("should produce different ciphertext for same content (due to random IV)", async () => {
      const key = await generateKey();
      const creds = [createPasswordCred()];

      const encrypted1 = await credentialsToEncryptedCSV(key, creds);
      const encrypted2 = await credentialsToEncryptedCSV(key, creds);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });

    it("encrypted content should be decryptable", async () => {
      const key = await generateKey();
      const creds = [
        createPasswordCred({
          description: "Decryption Test",
          url: "https://decrypt.test",
          username: "decryptuser",
          password: "decryptpass",
        }),
      ];

      const encrypted = await credentialsToEncryptedCSV(key, creds);
      const decrypted = (await decrypt(key, encrypted)) as { csv: string };

      expect(decrypted).toHaveProperty("csv");
      expect(decrypted.csv).toContain("name,url,username,password,note");
      expect(decrypted.csv).toContain("Decryption Test");
      expect(decrypted.csv).toContain("https://decrypt.test");
      expect(decrypted.csv).toContain("decryptuser");
      expect(decrypted.csv).toContain("decryptpass");
    });
  });

  describe("unencrypted export produces plaintext CSV", () => {
    it("should produce plaintext CSV string", () => {
      const creds = [
        createPasswordCred({
          description: "Plain Site",
          url: "https://plain.com",
          username: "plainuser",
          password: "plainpass",
        }),
      ];

      const csv = credentialsToCSV(creds);

      expect(typeof csv).toBe("string");
      expect(csv).not.toContain("iv");
      expect(csv).not.toContain("ciphertext");
      expect(csv).toContain("name,url,username,password,note");
      expect(csv).toContain("Plain Site");
      expect(csv).toContain("plainpass");
    });

    it("should exclude deleted credentials", () => {
      const creds = [
        createPasswordCred({
          description: "Active",
          url: "https://active.com",
          username: "active",
          password: "active",
        }),
        {
          version: CURRENT_VERSION,
          type: PASSWORD_TYPE,
          id: 12345,
          timestamp: Date.now(),
          isDeleted: true,
          url: "https://deleted.com",
        } as any,
      ];

      const csv = credentialsToCSV(creds);
      const lines = csv.split("\n");

      expect(lines.length).toBe(2);
      expect(csv).toContain("Active");
      expect(csv).not.toContain("deleted.com");
    });

    it("should only include password credentials (not keypairs)", () => {
      const passwordCred = createPasswordCred({
        description: "Password",
        url: "https://password.com",
        username: "user",
        password: "pass",
      });

      const keypairCred = {
        version: CURRENT_VERSION,
        type: 1,
        id: 99999,
        timestamp: Date.now(),
        publicKey: "pubkey",
        privateKey: "privkey",
      };

      const csv = credentialsToCSV([passwordCred, keypairCred as any]);
      const lines = csv.split("\n");

      expect(lines.length).toBe(2);
      expect(csv).toContain("Password");
      expect(csv).not.toContain("pubkey");
    });
  });
});

describe("CSV Import", () => {
  describe("parsing valid CSV format", () => {
    it("should parse valid CSV with correct header", () => {
      const csv = `name,url,username,password,note
My Site,https://mysite.com,myuser,mypass,My note`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.credentials.length).toBe(1);
        expect(result.credentials[0].url).toBe("https://mysite.com");
        expect(result.credentials[0].username).toBe("myuser");
        expect(result.credentials[0].password).toBe("mypass");
        expect(result.credentials[0].description).toBe("My note");
      }
    });

    it("should parse multiple rows", () => {
      const csv = `name,url,username,password,note
Site A,https://a.com,userA,passA,Note A
Site B,https://b.com,userB,passB,Note B`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.credentials.length).toBe(2);
        expect(result.credentials[0].url).toBe("https://a.com");
        expect(result.credentials[1].url).toBe("https://b.com");
      }
    });

    it("should parse fields with quoted values and escaped characters", () => {
      const csv = `name,url,username,password,note
"Site, with comma",https://example.com,user,"pass,word","Note with ""quotes"""`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.credentials.length).toBe(1);
        expect(result.credentials[0].password).toBe("pass,word");
        expect(result.credentials[0].description).toBe('Note with "quotes"');
      }
    });

    it("should handle CSV row parsing with commas inside quotes", () => {
      const row = '"hello, world",simple,"with ""quotes""",last';
      const fields = parseCSVRow(row);

      expect(fields.length).toBe(4);
      expect(fields[0]).toBe("hello, world");
      expect(fields[1]).toBe("simple");
      expect(fields[2]).toBe('with "quotes"');
      expect(fields[3]).toBe("last");
    });

    it("should use name as description when note is empty", () => {
      const csv = `name,url,username,password,note
My Site Name,https://mysite.com,myuser,mypass,`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.credentials[0].description).toBe("My Site Name");
      }
    });
  });

  describe("encrypted CSV detection and decryption", () => {
    it("should detect encrypted CSV content", () => {
      const encrypted = JSON.stringify({
        iv: "abc123",
        ciphertext: "encrypted_data_here",
      });

      expect(isEncryptedCSV(encrypted)).toBe(true);
    });

    it("should not detect plaintext CSV as encrypted", () => {
      const plainCSV = `name,url,username,password,note
Site,https://site.com,user,pass,note`;

      expect(isEncryptedCSV(plainCSV)).toBe(false);
    });

    it("should not detect invalid JSON as encrypted", () => {
      const invalid = "not json at all";
      expect(isEncryptedCSV(invalid)).toBe(false);
    });

    it("should not detect JSON without required fields as encrypted", () => {
      const partialJSON = JSON.stringify({ iv: "abc" });
      expect(isEncryptedCSV(partialJSON)).toBe(false);
    });

    it("should decrypt and parse encrypted CSV", async () => {
      const key = await generateKey();
      const creds = [
        createPasswordCred({
          description: "Encrypted Site",
          url: "https://encrypted.com",
          username: "encuser",
          password: "encpass",
        }),
      ];

      const encrypted = await credentialsToEncryptedCSV(key, creds);
      const encryptedContent = JSON.stringify(encrypted);

      const result = await decryptAndParseCSV(key, encryptedContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.credentials.length).toBe(1);
        expect(result.credentials[0].url).toBe("https://encrypted.com");
        expect(result.credentials[0].username).toBe("encuser");
        expect(result.credentials[0].password).toBe("encpass");
      }
    });

    it("should fail decryption with wrong key", async () => {
      const key1 = await generateKey();
      const key2 = await generateKey();
      const creds = [createPasswordCred()];

      const encrypted = await credentialsToEncryptedCSV(key1, creds);
      const encryptedContent = JSON.stringify(encrypted);

      const result = await decryptAndParseCSV(key2, encryptedContent);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Decryption failed");
      }
    });
  });

  describe("invalid CSV format handling", () => {
    it("should return error for empty content", () => {
      const result = parseCSV("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("empty");
      }
    });

    it("should return error for missing required columns", () => {
      const csv = `name,url
Site,https://site.com`;

      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Missing required columns");
        expect(result.error).toContain("username");
        expect(result.error).toContain("password");
        expect(result.error).toContain("note");
      }
    });

    it("should validate CSV header correctly", () => {
      const validHeader = "name,url,username,password,note";
      const result = validateCSVHeader(validHeader);

      expect(result.valid).toBe(true);
      expect(result.indices).toBeDefined();
      expect(result.indices!.name).toBe(0);
      expect(result.indices!.url).toBe(1);
    });

    it("should skip empty rows", () => {
      const csv = `name,url,username,password,note
Site A,https://a.com,userA,passA,Note A

Site B,https://b.com,userB,passB,Note B`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.credentials.length).toBe(2);
      }
    });

    it("should skip rows with no meaningful data", () => {
      const csv = `name,url,username,password,note
Site A,https://a.com,userA,passA,Note A
,,,`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.credentials.length).toBe(1);
      }
    });
  });

  describe("imported credentials merge with existing", () => {
    it("should filter out credentials that already exist (same url+username)", () => {
      const existing = [
        createPasswordCred({
          url: "https://existing.com",
          username: "existinguser",
          password: "existingpass",
        }),
      ];

      const imported = [
        createPasswordCred({
          url: "https://existing.com",
          username: "existinguser",
          password: "newpass",
        }),
        createPasswordCred({
          url: "https://new.com",
          username: "newuser",
          password: "newpass",
        }),
      ];

      const merged = mergeImportedCredentials(existing, imported);

      expect(merged.length).toBe(1);
      expect(merged[0].url).toBe("https://new.com");
    });

    it("should allow same URL with different username", () => {
      const existing = [
        createPasswordCred({
          url: "https://site.com",
          username: "user1",
        }),
      ];

      const imported = [
        createPasswordCred({
          url: "https://site.com",
          username: "user2",
        }),
      ];

      const merged = mergeImportedCredentials(existing, imported);

      expect(merged.length).toBe(1);
      expect(merged[0].username).toBe("user2");
    });

    it("should return all imported when no existing credentials", () => {
      const existing: PasswordAdditionCred[] = [];
      const imported = [
        createPasswordCred({ url: "https://a.com", username: "a" }),
        createPasswordCred({ url: "https://b.com", username: "b" }),
      ];

      const merged = mergeImportedCredentials(existing, imported);

      expect(merged.length).toBe(2);
    });

    it("should return empty array when all imported already exist", () => {
      const existing = [
        createPasswordCred({ url: "https://a.com", username: "a" }),
        createPasswordCred({ url: "https://b.com", username: "b" }),
      ];

      const imported = [
        createPasswordCred({ url: "https://a.com", username: "a" }),
        createPasswordCred({ url: "https://b.com", username: "b" }),
      ];

      const merged = mergeImportedCredentials(existing, imported);

      expect(merged.length).toBe(0);
    });

    it("should ignore deleted credentials when checking for duplicates", () => {
      const existing = [
        {
          version: CURRENT_VERSION,
          type: PASSWORD_TYPE,
          id: 12345,
          timestamp: Date.now(),
          isDeleted: true,
          url: "https://deleted.com",
          username: "deleteduser",
        } as any,
      ];

      const imported = [
        createPasswordCred({
          url: "https://deleted.com",
          username: "deleteduser",
          password: "newpass",
        }),
      ];

      const merged = mergeImportedCredentials(existing, imported);

      expect(merged.length).toBe(1);
    });
  });
});
