import {
  CURRENT_VERSION,
  getCredsByUrl,
  getMappingFromCredsByUrl,
  isPasswordCred,
  PASSWORD_TYPE,
  PasswordCred,
  passwordIndex,
} from "@/utils/credentials";
import { createKeyShortener } from "./utility";

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
