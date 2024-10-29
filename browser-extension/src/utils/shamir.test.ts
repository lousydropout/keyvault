// taken from https://github.com/paritytech/banana_split/blob/master/tests/unit/crypto.spec.ts
import { parse, reconstruct, share } from "@/utils/shamir";

test("encodes-decodes empty values", () => {
  const shards = share({
    data: "",
    title: "",
    passphrase: "",
    totalShards: 3,
    requiredShards: 2,
  });
  const parsed = shards.map((s) => parse(s));
  const reconstructed = reconstruct(parsed, "");
  expect(reconstructed).toBe("");
});

test("properly deserializes metadata", () => {
  const shards = share({
    data: "Secret message",
    title: "Secret title",
    passphrase: "correct horse battery staple",
    totalShards: 5,
    requiredShards: 3,
  });
  const parsed = shards.map((s) => parse(s));
  parsed.forEach((message) => {
    expect(message.title).toBe("Secret title");
    expect(message.requiredShards).toBe(3);
    expect(message.nonce).toBe(parsed[0].nonce);
  });
});

test("works with any 2 shards out of 3", () => {
  const shards = share({
    data: "Secret message",
    title: "Secret title",
    passphrase: "correct horse battery staple",
    totalShards: 3,
    requiredShards: 2,
  });
  const parsed = shards.map((s) => parse(s));
  [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 0],
    [2, 0],
    [2, 1],
  ].forEach(([i, j]) => {
    expect(
      reconstruct([parsed[i], parsed[j]], "correct horse battery staple")
    ).toBe("Secret message");
  });
});

test("fails with incorrect password", () => {
  const shards = share({
    data: "Secret message",
    title: "Secret title",
    passphrase: "correct horse battery staple",
    totalShards: 5,
    requiredShards: 3,
  });
  const parsed = shards.map((s) => parse(s));
  expect(() => reconstruct(parsed, "")).toThrow("Unable to decrypt the secret");
});

test("works with unicode strings", () => {
  const shards = share({
    data: "Текст сообщения",
    title: "Это секрет",
    passphrase: "correct horse battery staple",
    totalShards: 5,
    requiredShards: 3,
  });
  const parsed = shards.map((s) => parse(s));
  parsed.forEach((message) => {
    expect(message.title).toBe("Это секрет");
  });

  const reconstructed = reconstruct(parsed, "correct horse battery staple");
  expect(reconstructed).toBe("Текст сообщения");
});

test("reconstructs the reference example of v0 serialization", () => {
  const shards = [
    '{"t":"Very secret info","r":2,"d":"803c12929ba469d720a63fc8ca6f6ef1cc441f8f0b830ea04f8a484169ec800e4a7","n":"29abbb2c509adedb470f6d3fd3d083362b8c1a9283adf987"}',
    '{"t":"Very secret info","r":2,"d":"801b4196813bb664141169f939414fec30c7f343326d8df45e557b25b0249fd43e2","n":"29abbb2c509adedb470f6d3fd3d083362b8c1a9283adf987"}',
    '{"t":"Very secret info","r":2,"d":"80275318760b66ee5a1d7430dbf8769fda05e9e1ff7447eaa78539fbed006f0390b","n":"29abbb2c509adedb470f6d3fd3d083362b8c1a9283adf987"}',
  ].map((s) => parse(s));

  [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 0],
    [2, 0],
    [2, 1],
  ].forEach(([i, j]) => {
    expect(
      reconstruct([shards[i], shards[j]], "amazing-daring-panda-horror")
    ).toBe("Any questions?");
  });
});

test("reconstructs the reference example of v1 serialization", () => {
  const shards = [
    '{"v":1,"t":"Pssst","r":2,"d":"8AdI3F1Xn4CK9mXEVWLWgg2gzho5WV38E/hn1OYyRMZenL/Jm6dmrZoiji2ZlMSVEW+XN9WW1I/ilDC1yiu4oBa4=","n":"a17TDZHP2iL/sdPHgFJUP3NlAC7bDgrp"}',
    '{"v":1,"t":"Pssst","r":2,"d":"8ArluLqrT3URnL+IqsHddG9MpXqvSNt5JBLfTqSJmCg4raIFLg2XhfbnFLCTgCumI4qByThq9bBxnwLy8EgEHYiw=","n":"a17TDZHP2iL/sdPHgFJUP3NlAC7bDgrp"}',
    '{"v":1,"t":"Pssst","r":2,"d":"8A2tZOf80PWbatpM/6ML9mLrUFkOu4kpyUiY62bPA6HmkVVtQpfosdF3nuhpo6K3MfmjsJ8ROokDShDgNka/ptFI=","n":"a17TDZHP2iL/sdPHgFJUP3NlAC7bDgrp"}',
  ].map((s) => parse(s));

  [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 0],
    [2, 0],
    [2, 1],
  ].forEach(([i, j]) => {
    expect(reconstruct([shards[i], shards[j]], "excess-torch-unfold-fix")).toBe(
      "Version one is all-around better"
    );
  });
});

test("throws an error if nonces mismatch", () => {
  const shards = share({
    data: "Message",
    title: "Title",
    passphrase: "correct horse battery staple",
    totalShards: 3,
    requiredShards: 2,
  }).map((s) => parse(s));
  shards[0].nonce = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  expect(() =>
    reconstruct([shards[0], shards[1]], "correct horse battery staple")
  ).toThrow(/Nonces mismatch/);
});

test("throws an error if titles mismatch", () => {
  const shards = share({
    data: "Message",
    title: "Title",
    passphrase: "correct horse battery staple",
    totalShards: 3,
    requiredShards: 2,
  }).map((s) => parse(s));
  shards[0].title = "Completely different title";
  expect(() =>
    reconstruct([shards[0], shards[1]], "correct horse battery staple")
  ).toThrow(/Titles mismatch/);
});

test("doesn't work if less shards than necessary are supplied", () => {
  const shards = share({
    data: "Message",
    title: "Title",
    passphrase: "correct horse battery staple",
    totalShards: 5,
    requiredShards: 3,
  }).map((s) => parse(s));
  expect(() =>
    reconstruct([shards[0], shards[1]], "correct horse battery staple")
  ).toThrow(/Not enough shards/);
});
