import {
  convertToPasswordCred,
  createBarePasswordCred,
  isPasswordCred,
} from "@/utils/credentials";
import { decrypt, generateKey } from "@/utils/encryption";

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const abi = [
  {
    inputs: [],
    name: "retrieve",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const getEntries = async () => {
  const client = createPublicClient({ chain: sepolia, transport: http() });

  try {
    const results = await client.readContract({
      address: "0x7a6655b41f17eeC08a1eFF5bf8D16C89A8372922",
      abi: abi,
      functionName: "retrieve",
      args: [],
    });

    return results;
  } catch (error) {
    console.error("Error reading pure function:", error);
  }
};

const cred = createBarePasswordCred({
  url: "https://example.com",
  username: "example",
  password: "password",
  description: "example",
  curr: 10,
  prev: 3,
});

describe("Encryption", () => {
  it("decryption of ciphertext to return original plaintext", async () => {
    const key = await generateKey();
    const passwordCred = await convertToPasswordCred(key, cred);
    const unencrypted = JSON.parse(await decrypt(key, passwordCred.encrypted));

    console.log("passwordCred: ", passwordCred);
    console.log("isPasswordCred(passwordCred): ", isPasswordCred(passwordCred));
    console.log("unencrypted: ", unencrypted);

    expect(isPasswordCred(passwordCred)).toBeTruthy();
    expect(unencrypted).toEqual(cred);
  });

  it("something", async () => {
    const entries = (await getEntries()) as bigint[];

    const results = entries.map((result) =>
      Number.parseInt(result?.toString() || "0")
    );

    console.log("entries: ", entries);
    console.log("results: ", results);

    expect(entries).toBeTruthy();
  });

  it("iv should be length 16", async () => {
    const key = await generateKey();

    for (let i = 0; i < 100; i++) {
      const passwordCred = await convertToPasswordCred(key, cred);

      expect(passwordCred.encrypted.iv.length).toBe(16);
    }
  });
});
