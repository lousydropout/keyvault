import {
  addNext,
  Cred,
  deleteK,
  getCredsByUrl,
  getPasswordChains,
  InvalidCred,
  isPasswordCred,
  isValidCred,
  mergeCreds,
  PasswordCred,
  ValidCred,
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
const y2: PasswordCred = {
  isValid: true,
  id: "4c9ccca3-8c75-4bd7-a0a8-7dd39b29cdcd",
  encrypted: { iv: "iv2", ciphertext: "ciphertext2", onChain: true },
  type: "password",
  timestamp: "2021-11-04T01:00:00.000Z",
  curr: 5,
  prev: 3,
  url: "https://example.com",
  username: "user2",
  password: "pass2-2",
  description: "Credential 2",
  isDeleted: false,
};
const alpha: InvalidCred = {
  isValid: false,
  encrypted: { iv: "iv5", ciphertext: "ciphertext5", onChain: true },
};

const credentials: Cred[] = [w, x, xDeleted, y, z, alpha];
const validCreds: ValidCred[] = [w, x, xDeleted, y, z, y2];

const getFields = (cred: Cred) => {
  if (!isValidCred(cred)) throw new Error("Invalid cred");
  return {
    id: cred.id,
    type: cred.type,
    isValid: cred.isValid,
    timestamp: cred.timestamp,
    curr: cred.curr,
    prev: cred.prev,
    onChain: cred.encrypted.onChain,
  };
};

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
    expect({
      "0": [w, x, xDeleted],
      "3": [y],
      "4": [z],
    }).toEqual(passwords);
  });
});

describe("Grouping credentials by URL", () => {
  const credsByUrl = getCredsByUrl(credentials);

  it("should have chains listed in chronological order of first cred in chain", () => {
    const expectedOutput = {
      "https://example.com": [[w, x, xDeleted], [y]],
      "https://example.org": [[z]],
    };
    expect(expectedOutput).toEqual(credsByUrl);

    const outputWithIncorrectOrder = {
      "https://example.com": [[y], [w, x, xDeleted]],
      "https://example.org": [[z]],
    };
    expect(outputWithIncorrectOrder).not.toEqual(credsByUrl);
  });
});

describe("Transformations on encrypteds and credentials", () => {
  it("Each cred should have a 'next' field that points to the next credential in the chain", () => {
    const extendedCreds = addNext(validCreds);
    const nexts = extendedCreds.map((cred) => cred.next);
    const expected = [1, 2, -1, 5, -1, -1];

    expect(nexts).toEqual(expected);
  });

  it("ID of deleted cred[k] should not appear", () => {
    const credsOffChain = validCreds.map((cred) => {
      const result = structuredClone(cred);
      result.encrypted.onChain = false;
      return result;
    });

    for (let k = 0; k < validCreds.length; k++) {
      const output = deleteK(structuredClone(credsOffChain), k);

      expect(validCreds.length - 1).toEqual(
        output.map((cred) => (isValidCred(cred) ? cred.curr : -100)).length
      );

      expect(
        output.map((cred) => {
          isValidCred(cred) ? cred.id : "nope";
        })
      ).not.toContain(validCreds[k].id);
    }
  });

  it("should be able to delete an off-chain and non-terminal cred at index k that", () => {
    const credsOffChain = validCreds.map((cred) => {
      const result = structuredClone(cred);
      result.encrypted.onChain = false;
      return result;
    });

    const k = 3;
    const output = deleteK(credsOffChain, k);

    expect([-1, 0, 1, -1, -1]).toEqual(
      output.map((cred) => (isValidCred(cred) ? cred.prev : -100))
    );
  });

  it("should be able to delete an off-chain and terminal cred at index k that", () => {
    const credsOffChain = validCreds.map((cred) => {
      const result = structuredClone(cred);
      result.encrypted.onChain = false;
      return result;
    });

    const k = 2;
    const output = deleteK(credsOffChain, k);

    expect([-1, 0, -1, -1, 2]).toEqual(
      output.map((cred) => (isValidCred(cred) ? cred.prev : -100))
    );
  });

  it("should be able to delete an off-chain and initial cred at index k that", () => {
    const credsOffChain = validCreds.map((cred) => {
      const result = structuredClone(cred);
      result.encrypted.onChain = false;
      return result;
    });

    const k = 0;
    const output = deleteK(credsOffChain, k);

    expect([-1, 0, -1, -1, 2]).toEqual(
      output.map((cred) => (isValidCred(cred) ? cred.prev : -100))
    );
  });

  it("should throw an exception when trying to delete an on-chain cred", () => {
    const creds = structuredClone(validCreds);
    const k = 0;

    expect(() => deleteK(creds, k)).toThrow();
  });

  it("should be able to merge an off-chain creds with an on-chain one", () => {
    const numOnChain = 3;
    const onChainCreds = validCreds.slice(0, numOnChain);
    const offChainCreds = validCreds.map((cred, i) => {
      const result = structuredClone(cred);
      if (i >= numOnChain) result.encrypted.onChain = false;
      return result;
    });

    validCreds.forEach((cred, i) => {
      if (i >= numOnChain) cred.encrypted.onChain = false;
    });

    const merged = mergeCreds(addNext(offChainCreds), addNext(onChainCreds));
    expect(merged.map(getFields)).toEqual(validCreds.map(getFields));
  });
});
