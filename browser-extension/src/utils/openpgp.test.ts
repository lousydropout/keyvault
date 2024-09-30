import {
  decryptMessage,
  encryptMessage,
  genKey,
  importPrivateKey,
  importPublicKey,
  reformatKey,
  signClearTextMessage,
  signMessage,
  verifyDetachedSignature,
  verifySignedMessage,
} from "@/utils/openpgp";
import { PrivateKey, PublicKey } from "openpgp";

describe("PGP Module Unit Tests", () => {
  let privateKey_1: PrivateKey;
  let publicKey_1: PublicKey;
  let keyId_1: string;

  let privateKey_2: PrivateKey;
  let publicKey_2: PublicKey;
  let keyId_2: string;

  beforeAll(async () => {
    // Generate key pair before running tests
    const keyPair_1 = await genKey();
    privateKey_1 = await importPrivateKey(keyPair_1.privateKey);
    publicKey_1 = await importPublicKey(keyPair_1.publicKey);
    keyId_1 = keyPair_1.keyId;

    console.log("publicKey_1: ", publicKey_1.armor());

    const keyPair_2 = await genKey();
    privateKey_2 = await importPrivateKey(keyPair_2.privateKey);
    publicKey_2 = await importPublicKey(keyPair_2.publicKey);
    keyId_2 = keyPair_2.keyId;
  });

  test("should generate a valid key pair", async () => {
    const keyPair = await genKey();
    expect(keyPair).toHaveProperty("privateKey");
    expect(keyPair).toHaveProperty("publicKey");
    expect(keyPair).toHaveProperty("keyId");
  });

  test("private key should be able to generate its public key counterpart", () => {
    const _publicKey = privateKey_1.toPublic();
    expect(_publicKey.armor()).toEqual(publicKey_1.armor());
  });

  test("private key should be able to produce its keyId", () => {
    const _keyId = privateKey_1.getKeyID().toHex();
    expect(_keyId).toEqual(keyId_1);
  });

  test("should be able to import an ASCII armored private key", async () => {
    const armoredPrivateKey = reformatKey(privateKey_1.armor());

    const importedPrivateKey = await importPrivateKey({
      body: armoredPrivateKey.body,
      crc: armoredPrivateKey.crc,
    });

    expect(importedPrivateKey.armor()).toEqual(privateKey_1.armor());
  });

  test("should sign a cleartext message", async () => {
    const message = "This is a cleartext message";
    const signedMessage = await signClearTextMessage({
      message,
      privateKeys: privateKey_1,
    });

    expect(signedMessage).toBeDefined();
  });

  test("should sign a message and return a detached signature", async () => {
    const message = "This is a message";
    const signature = await signMessage({
      message,
      privateKeys: privateKey_1,
    });
    expect(signature).toBeDefined();
  });

  test("detached signature signed with privateKey_1 should be verifiable with publicKey_1", async () => {
    const message = "This is a message";
    const signature = await signMessage({
      message,
      privateKeys: privateKey_1,
    });

    const verificationResult = await verifyDetachedSignature({
      message,
      signature,
      publicKeys: publicKey_1,
    });

    expect(verificationResult.isValid).toBe(true);
    expect(verificationResult.signedBy).toEqual(keyId_1);
  });

  test("detached signature signed with privateKey_1 should NOT be verifiable with publicKey_2", async () => {
    const message = "This is a message";
    const signature = await signMessage({
      message,
      privateKeys: privateKey_1,
    });

    const verificationResult = await verifyDetachedSignature({
      message,
      signature,
      publicKeys: publicKey_2,
    });

    expect(verificationResult.isValid).toBe(false);
    expect(verificationResult.signedBy).toEqual(keyId_1);
  });

  test("messages signed with privateKey_1 should be verifiable with publicKey_1", async () => {
    const message = "This is a signed message";
    const signedMessage = await signClearTextMessage({
      message,
      privateKeys: privateKey_1,
    });

    const verificationResult = await verifySignedMessage({
      signedMessage,
      publicKeys: publicKey_1,
    });

    expect(verificationResult.isValid).toBe(true);
    expect(verificationResult.signedBy).toEqual(keyId_1);
  });

  test("messages signed with privateKey_1 should NOT be verifiable with publicKey_2", async () => {
    const message = "This is a signed message";
    const signedMessage = await signClearTextMessage({
      message,
      privateKeys: privateKey_1,
    });

    const verificationResult = await verifySignedMessage({
      signedMessage,
      publicKeys: publicKey_2,
    });
    expect(verificationResult.isValid).toBe(false);
    expect(verificationResult.signedBy).toEqual(keyId_1);
  });

  test("should encrypt a message", async () => {
    const message = "This is a secret message";
    const encryptedMessage = await encryptMessage({
      message,
      receviersPublicKey: publicKey_1,
      privateKey: privateKey_1,
    });
    expect(encryptedMessage).toBeDefined();
  });

  test("messages encrypted with publicKey_2 and signed with privateKey_1 should be decryptable using privateKey_2 and verifiable with publicKey_1", async () => {
    const message = "This is a secret message";
    const encryptedMessage = await encryptMessage({
      message,
      receviersPublicKey: publicKey_2,
      privateKey: privateKey_1,
    });

    const decryptedMessage = await decryptMessage({
      ciphertext: encryptedMessage,
      sendersPublicKey: publicKey_1,
      privateKey: privateKey_2,
    });

    expect(decryptedMessage.plaintext).toEqual(message);
    expect(decryptedMessage.isValid).toBe(true);
    expect(decryptedMessage.signedBy).toEqual(keyId_1);
  });
});
