import {
  CredsByUrl,
  CredsMapping,
  getCredsByUrl,
  getMappingFromCredsByUrl,
  PASSWORD_TYPE,
  PasswordCred,
  updateWithNewPasswordCred,
  updateWithNewPasswordCredInPlace,
} from "@/utils/credentials";

const generateCred = ({
  id,
  url,
  username,
  password,
  description,
  deleted,
  timestamp,
}: {
  id: number;
  url?: string;
  username?: string;
  password?: string;
  description?: string;
  deleted?: boolean;
  timestamp: number;
}): PasswordCred => {
  if (deleted)
    return {
      version: 1,
      id,
      type: PASSWORD_TYPE,
      url: url || "test-url",
      timestamp,
      isDeleted: true,
    };
  return {
    version: 1,
    id,
    type: PASSWORD_TYPE,
    timestamp,

    url: url || "test-url",
    username: username || "test-username",
    password: password || "test-password",
    description: description || "test-description",
    isDeleted: false,
  };
};

describe("updateWithNewPasswordCred", () => {
  const x = generateCred({ id: 1, timestamp: 1 });
  const x2 = generateCred({
    id: 1,
    timestamp: 2,
    username: "test-username-2",
  });
  const x3 = generateCred({
    id: 1,
    timestamp: 3,
    password: "test-password-3",
  });
  const x4 = generateCred({
    id: 1,
    timestamp: 4,
    url: "test-url-2",
  });
  const y = generateCred({
    id: 2,
    timestamp: 4,
    url: "test-url-2",
  });

  it("should add cred to empty record", () => {
    let record: CredsByUrl = {};
    let mapping: CredsMapping = {};

    ({ mapping, record } = updateWithNewPasswordCred(x, record, mapping));
    expect(mapping[1]).toEqual(["test-url", 0]);
    expect(record["test-url"]).toEqual([[x]]);
  });

  it("should add cred as chain to new url if !(url in record)", () => {
    let record: CredsByUrl = {};
    let mapping: CredsMapping = {};

    ({ mapping, record } = updateWithNewPasswordCred(x, record, mapping));
    expect(mapping[1]).toEqual(["test-url", 0]);
    expect(record["test-url"]).toEqual([[x]]);

    ({ mapping, record } = updateWithNewPasswordCred(x2, record, mapping));
    expect(mapping[1]).toEqual(["test-url", 0]);
    expect(record["test-url"]).toEqual([[x, x2]]);

    ({ mapping, record } = updateWithNewPasswordCred(x3, record, mapping));
    expect(mapping[1]).toEqual(["test-url", 0]);
    expect(record["test-url"]).toEqual([[x, x2, x3]]);
  });

  it("should add multiple url to chain okay", () => {
    let record: CredsByUrl = {};
    let mapping: CredsMapping = {};

    ({ mapping, record } = updateWithNewPasswordCred(x, record, mapping));
    ({ mapping, record } = updateWithNewPasswordCred(x2, record, mapping));
    ({ mapping, record } = updateWithNewPasswordCred(x3, record, mapping));
    ({ mapping, record } = updateWithNewPasswordCred(y, record, mapping));

    expect(mapping[1]).toEqual(["test-url", 0]);
    expect(record["test-url"]).toEqual([[x, x2, x3]]);
    expect(mapping[2]).toEqual(["test-url-2", 0]);
    expect(record["test-url-2"]).toEqual([[y]]);
  });

  it("should be able to move chain when `url` changes", () => {
    const record: CredsByUrl = {};
    const mapping: CredsMapping = {};

    updateWithNewPasswordCredInPlace(x, record, mapping);
    updateWithNewPasswordCredInPlace(x2, record, mapping);
    updateWithNewPasswordCredInPlace(x3, record, mapping);
    updateWithNewPasswordCredInPlace(x4, record, mapping);

    expect(mapping[1]).toEqual(["test-url-2", 0]);
    expect(record["test-url-2"]).toEqual([[x, x2, x3, x4]]);
  });

  describe("Comparing `updateWithNewPasswordCred` and `getCredsByUrl`", () => {
    it("1", () => {
      const record: CredsByUrl = {};
      const mapping: CredsMapping = {};

      updateWithNewPasswordCredInPlace(x, record, mapping);
      updateWithNewPasswordCredInPlace(x2, record, mapping);
      updateWithNewPasswordCredInPlace(x3, record, mapping);

      expect(mapping[1]).toEqual(["test-url", 0]);
      expect(record["test-url"]).toEqual([[x, x2, x3]]);

      const credsByUrl = getCredsByUrl([x, x2, x3]);
      const _mapping = getMappingFromCredsByUrl(credsByUrl);

      expect(mapping).toEqual(_mapping);
      expect(record).toEqual(credsByUrl);
    });
  });
});
