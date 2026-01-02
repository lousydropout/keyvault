import { decrypt, encrypt, Encrypted } from "@/utils/encryption";
import {
  createNewPasswordCred,
  Cred,
  isPasswordAdditionCred,
  PasswordAdditionCred,
} from "@/utils/credentials";

/**
 * CSV header row for Chrome password manager compatible format.
 */
const CSV_HEADER = "name,url,username,password,note";

/**
 * Expected CSV columns in order.
 */
const CSV_COLUMNS = ["name", "url", "username", "password", "note"] as const;

/**
 * Result of CSV import operation.
 */
export type CSVImportResult =
  | { success: true; credentials: PasswordAdditionCred[] }
  | { success: false; error: string };

/**
 * Escapes a string value for CSV format according to RFC 4180.
 * - Fields containing commas, double quotes, or newlines are enclosed in double quotes
 * - Double quotes within fields are escaped by doubling them
 *
 * @param value - The string value to escape
 * @returns The escaped string value
 */
export const escapeCSVField = (value: string): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  const needsQuoting =
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r");

  if (needsQuoting) {
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return stringValue;
};

/**
 * Unescapes a CSV field according to RFC 4180.
 * - Removes surrounding double quotes if present
 * - Converts doubled double quotes back to single quotes
 *
 * @param value - The escaped string value
 * @returns The unescaped string value
 */
export const unescapeCSVField = (value: string): string => {
  if (!value) {
    return "";
  }

  let result = value.trim();

  if (result.startsWith('"') && result.endsWith('"')) {
    result = result.slice(1, -1);
    result = result.replace(/""/g, '"');
  }

  return result;
};

/**
 * Parses a CSV row handling quoted fields and escaped characters.
 * Properly handles:
 * - Fields with commas inside quotes
 * - Fields with newlines inside quotes
 * - Escaped double quotes (doubled)
 *
 * @param row - A single CSV row string
 * @returns Array of field values
 */
export const parseCSVRow = (row: string): string[] => {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < row.length && row[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ",") {
        fields.push(current);
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  fields.push(current);

  return fields;
};

/**
 * Validates that required CSV columns are present in the header.
 *
 * @param header - The header row string
 * @returns Object with validation result and column indices
 */
export const validateCSVHeader = (
  header: string
): { valid: boolean; error?: string; indices?: Record<string, number> } => {
  const fields = parseCSVRow(header.toLowerCase());

  const indices: Record<string, number> = {};
  const missingColumns: string[] = [];

  for (const col of CSV_COLUMNS) {
    const index = fields.indexOf(col);
    if (index === -1) {
      missingColumns.push(col);
    } else {
      indices[col] = index;
    }
  }

  if (missingColumns.length > 0) {
    return {
      valid: false,
      error: `Missing required columns: ${missingColumns.join(", ")}`,
    };
  }

  return { valid: true, indices };
};

/**
 * Parses CSV content into an array of credentials.
 * Expects Chrome password manager compatible format: name,url,username,password,note
 *
 * @param content - The CSV content string
 * @returns CSVImportResult with credentials or error message
 */
export const parseCSV = (content: string): CSVImportResult => {
  if (!content || content.trim() === "") {
    return { success: false, error: "CSV content is empty" };
  }

  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 1) {
    return { success: false, error: "CSV file has no content" };
  }

  const headerValidation = validateCSVHeader(lines[0]);
  if (!headerValidation.valid) {
    return { success: false, error: headerValidation.error! };
  }

  const indices = headerValidation.indices!;
  const credentials: PasswordAdditionCred[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);

    const url = fields[indices.url] || "";
    const username = fields[indices.username] || "";
    const password = fields[indices.password] || "";
    const name = fields[indices.name] || "";
    const note = fields[indices.note] || "";

    if (!url && !username && !password) {
      continue;
    }

    // createNewPasswordCred always creates non-deleted credentials
    const cred = createNewPasswordCred({
      url,
      username,
      password,
      description: note || name,
    }) as PasswordAdditionCred;

    credentials.push(cred);
  }

  return { success: true, credentials };
};

/**
 * Checks if content appears to be encrypted (JSON with iv and ciphertext).
 *
 * @param content - The content string to check
 * @returns True if content appears to be encrypted
 */
export const isEncryptedCSV = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content);
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.iv === "string" &&
      typeof parsed.ciphertext === "string"
    );
  } catch {
    return false;
  }
};

/**
 * Decrypts encrypted CSV content and parses it.
 *
 * @param cryptoKey - The decryption key
 * @param encryptedContent - The encrypted content string (JSON format)
 * @returns Promise resolving to CSVImportResult
 */
export const decryptAndParseCSV = async (
  cryptoKey: CryptoKey,
  encryptedContent: string
): Promise<CSVImportResult> => {
  try {
    const encrypted: Encrypted = JSON.parse(encryptedContent);

    if (!encrypted.iv || !encrypted.ciphertext) {
      return { success: false, error: "Invalid encrypted format" };
    }

    const decrypted = (await decrypt(cryptoKey, encrypted)) as { csv?: string };

    if (!decrypted.csv) {
      return { success: false, error: "Decrypted content does not contain CSV data" };
    }

    return parseCSV(decrypted.csv);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Decryption failed";
    return { success: false, error: `Decryption failed: ${message}` };
  }
};

/**
 * Converts a single credential to a CSV row.
 *
 * @param cred - The password credential to convert
 * @returns A CSV row string
 */
const credentialToCSVRow = (cred: PasswordAdditionCred): string => {
  const name = escapeCSVField(cred.description || "");
  const url = escapeCSVField(cred.url);
  const username = escapeCSVField(cred.username);
  const password = escapeCSVField(cred.password);
  const note = escapeCSVField(cred.description || "");

  return `${name},${url},${username},${password},${note}`;
};

/**
 * Converts an array of credentials to CSV format.
 * Uses Chrome password manager compatible format with columns: name, url, username, password, note
 *
 * @param credentials - Array of credentials to convert
 * @returns CSV formatted string with header row
 */
export const credentialsToCSV = (credentials: Cred[]): string => {
  const passwordCreds = credentials.filter(
    (cred): cred is PasswordAdditionCred =>
      isPasswordAdditionCred(cred) && !cred.isDeleted
  );

  const rows = passwordCreds.map(credentialToCSVRow);

  return [CSV_HEADER, ...rows].join("\n");
};

/**
 * Encrypts CSV content using the provided encryption key.
 *
 * @param cryptoKey - The encryption key to use
 * @param csvContent - The CSV content to encrypt
 * @returns Promise resolving to the encrypted data
 */
export const encryptCSV = async (
  cryptoKey: CryptoKey,
  csvContent: string
): Promise<Encrypted> => {
  return encrypt(cryptoKey, { csv: csvContent });
};

/**
 * Converts credentials to encrypted CSV format.
 *
 * @param cryptoKey - The encryption key to use
 * @param credentials - Array of credentials to convert and encrypt
 * @returns Promise resolving to the encrypted CSV data
 */
export const credentialsToEncryptedCSV = async (
  cryptoKey: CryptoKey,
  credentials: Cred[]
): Promise<Encrypted> => {
  const csvContent = credentialsToCSV(credentials);
  return encryptCSV(cryptoKey, csvContent);
};

/**
 * Merges imported credentials with existing credentials.
 * Does not overwrite existing credentials with the same URL and username.
 *
 * @param existing - Existing credentials array
 * @param imported - Imported credentials array
 * @returns Merged credentials (only new credentials that don't duplicate existing ones)
 */
export const mergeImportedCredentials = (
  existing: Cred[],
  imported: PasswordAdditionCred[]
): PasswordAdditionCred[] => {
  const existingKeys = new Set<string>();

  for (const cred of existing) {
    if (isPasswordAdditionCred(cred) && !cred.isDeleted) {
      const key = `${cred.url}|${cred.username}`;
      existingKeys.add(key);
    }
  }

  return imported.filter((cred) => {
    const key = `${cred.url}|${cred.username}`;
    return !existingKeys.has(key);
  });
};
