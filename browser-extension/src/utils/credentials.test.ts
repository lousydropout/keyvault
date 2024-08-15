import {
  Cred,
  getCredsByUrl,
  getPasswordChains,
  InvalidCred,
  isPasswordCred,
  PasswordCred,
} from "@/utils/credentials";

const w: PasswordCred = {
  isValid: true,
  id: "56f22adc-d3a1-4ca3-8a43-e9acbeb12256",
  type: "password",
  timestamp: "2021-10-01T00:00:00.000Z",
  encrypted: { iv: "iv1", ciphertext: "ciphertext1", onChain: true },
  curr: 0,
  prev: -1,
  url: "https://example.com",
  username: "user1",
  password: "pass1",
  description: "Credential 1",
  isDeleted: false,
};
const x: PasswordCred = {
  isValid: true,
  id: "f8d3c49a-41ee-44f9-8aa9-176063dcf818",
  type: "password",
  timestamp: "2021-10-02T00:00:00.000Z",
  encrypted: { iv: "iv1-2", ciphertext: "ciphertext1-2", onChain: true },
  curr: 1,
  prev: 0,
  url: "https://example.com",
  username: "user1",
  password: "pass1-2",
  description: "Credential 1-2",
  isDeleted: false,
};
const xDeleted: PasswordCred = {
  type: "password",
  isValid: true,
  id: "ac3269d5-f0b0-46e1-ab3a-9a230fbb9084",
  url: "https://example.com",
  encrypted: { iv: "iv1-3", ciphertext: "ciphertext1-3", onChain: true },
  timestamp: "2021-10-03T00:00:00.000Z",
  isDeleted: true,
  curr: 2,
  prev: 1,
};
const y: PasswordCred = {
  isValid: true,
  id: "4c9ccca3-8c75-4bd7-a0a8-7dd39b29eba9",
  encrypted: { iv: "iv2", ciphertext: "ciphertext2", onChain: true },
  type: "password",
  timestamp: "2021-10-04T01:00:00.000Z",
  curr: 3,
  prev: -1,
  url: "https://example.com",
  username: "user2",
  password: "pass2",
  description: "Credential 2",
  isDeleted: false,
};
const z: PasswordCred = {
  isValid: true,
  id: "a3ed2683-c1ea-4702-9dc4-7c3559e0dc94",
  encrypted: { iv: "iv3", ciphertext: "ciphertext3", onChain: true },
  type: "password",
  timestamp: "2021-10-14T00:00:00.000Z",
  curr: 4,
  prev: -1,
  url: "https://example.org",
  username: "user3",
  password: "pass3",
  description: "Credential 3",
  isDeleted: false,
};
const alpha: InvalidCred = {
  isValid: false,
  encrypted: { iv: "iv5", ciphertext: "ciphertext5", onChain: true },
};

const credentials: Cred[] = [w, x, xDeleted, y, z, alpha];

describe("Password credentials", () => {
  const beta = {
    ...z,
    prev: 3,
    curr: 1,
  };
  const gamma = {
    ...z,
    prev: -2,
  };

  it.each([w, x, xDeleted, y, z])("should be a valid PasswordCred", (u) => {
    expect(isPasswordCred(u)).toBeTruthy();
  });

  it("should be NOT a valid PasswordCred if `id` is not a UUID", () => {
    expect(isPasswordCred({ ...w, id: "123" })).toBeFalsy();
  });

  it("should be NOT a valid PasswordCred if required fields are missing", () => {
    expect(isPasswordCred({})).toBeFalsy();
  });

  it("should be NOT a valid PasswordCred if `curr <= prev`", () => {
    expect(isPasswordCred(beta)).toBeFalsy();
  });

  it("should be NOT a valid PasswordCred if `prev < -1`", () => {
    expect(isPasswordCred(gamma)).toBeFalsy();
  });
});

describe("Password chains", () => {
  const passwords = getPasswordChains(credentials);

  it("should have modifications of the same cred be in the same array", () => {
    expect(passwords).toEqual({
      "0": [w, x, xDeleted],
      "3": [y],
      "4": [z],
    });
  });
});

describe("Grouping credentials by URL", () => {
  const credsByUrl = getCredsByUrl(credentials);

  it("should have chains listed in chronological order of first cred in chain", () => {
    const expectedOutput = {
      "https://example.com": [[w, x, xDeleted], [y]],
      "https://example.org": [[z]],
    };
    expect(credsByUrl).toEqual(expectedOutput);

    const outputWithIncorrectOrder = {
      "https://example.com": [[y], [w, x, xDeleted]],
      "https://example.org": [[z]],
    };
    expect(credsByUrl).not.toEqual(outputWithIncorrectOrder);
  });
});
