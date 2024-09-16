import {
  createCleartextMessage,
  createMessage,
  decrypt,
  encrypt,
  generateKey,
  Key,
  PrivateKey,
  PublicKey,
  readCleartextMessage,
  readKey,
  readMessage,
  readPrivateKey,
  readSignature,
  sign,
  verify,
  type MaybeArray,
  type VerifyMessageResult,
} from "openpgp";

const publicKeyHeader = "-----BEGIN PGP PUBLIC KEY BLOCK-----" as const;
const publicKeyFooter = "-----END PGP PUBLIC KEY BLOCK-----" as const;
const privateKeyHeader = "-----BEGIN PGP PRIVATE KEY BLOCK-----" as const;
const privateKeyFooter = "-----END PGP PRIVATE KEY BLOCK-----" as const;

type ImportKeyProps = {
  body: string;
  crc: string;
};

const reformatKey = (key: string): ImportKeyProps => {
  const x = key.split("\n").reduce((prev, line) => {
    if (line.startsWith("-----")) return prev;
    if (line.trim() === "") return prev;
    return prev + line;
  }, "");

  const body = x.slice(0, -5);
  const crc = x.slice(-5);
  return { body, crc };
};

const genKey = async () => {
  const { privateKey, publicKey } = await generateKey({
    type: "ecc",
    curve: "p384",
    userIDs: [{ name: "anon", email: "anon@abc.xyz" }],
    format: "armored",
  });
  const _publicKey = await readKey({ armoredKey: publicKey });

  const keyId = _publicKey.getKeyID().toHex();

  return {
    keyId,
    privateKey: reformatKey(privateKey),
    publicKey: reformatKey(publicKey),
  };
};

const armorKey = (
  { body, crc }: ImportKeyProps,
  type: "public" | "private"
): string => {
  const header = type === "public" ? publicKeyHeader : privateKeyHeader;
  const footer = type === "public" ? publicKeyFooter : privateKeyFooter;
  return `${header}\n\n${body}\n${crc}\n${footer}`;
};

const importPublicKey = (key: ImportKeyProps): Promise<Key> => {
  return readKey({ armoredKey: armorKey(key, "public") });
};

const importPrivateKey = (key: ImportKeyProps): Promise<PrivateKey> => {
  return readPrivateKey({ armoredKey: armorKey(key, "private") });
};

const signMessage = async ({
  message,
  privateKeys,
  detached = true,
}: {
  message: string;
  privateKeys: MaybeArray<PrivateKey>;
  detached?: boolean;
}): Promise<string> => {
  return sign({
    message: await createMessage({ text: message }),
    signingKeys: privateKeys,
    detached,
  });
};

const parseVerificationResult = async (
  verificationResult: VerifyMessageResult<string>
): Promise<{
  isValid: boolean;
  signedBy: string;
}> => {
  const { verified, keyID } = verificationResult.signatures[0];
  try {
    await verified; // throws on invalid signature
    return { isValid: true, signedBy: keyID.toHex() };
  } catch (e: unknown) {
    return { isValid: false, signedBy: keyID.toHex() };
  }
};

const verifyDetachedSignature = async ({
  message,
  signature,
  publicKeys,
}: {
  message: string;
  signature: string;
  publicKeys: MaybeArray<PublicKey>;
}): Promise<{
  isValid: boolean;
  signedBy: string;
}> => {
  const _signature = await readSignature({ armoredSignature: signature });

  const verificationResult = await verify({
    message: await createMessage({ text: message }),
    signature: _signature,
    verificationKeys: publicKeys,
  });

  return parseVerificationResult(verificationResult);
};

const verifySignedMessage = async ({
  signedMessage,
  publicKeys,
}: {
  signedMessage: string;
  publicKeys: MaybeArray<PublicKey>;
}): Promise<{
  isValid: boolean;
  signedBy: string;
}> => {
  const cleartextMessage = signedMessage;
  const verificationKeys = publicKeys;

  const message = await readCleartextMessage({ cleartextMessage });
  const verificationResult = await verify({ message, verificationKeys });

  return parseVerificationResult(verificationResult);
};

const signClearTextMessage = async ({
  message,
  privateKeys,
}: {
  message: string;
  privateKeys: MaybeArray<PrivateKey>;
}) => {
  const text = message;
  const unsignedMessage = await createCleartextMessage({ text });
  return sign({ message: unsignedMessage, signingKeys: privateKeys });
};

const encryptMessage = async ({
  message,
  receviersPublicKey,
  privateKey,
}: {
  message: string;
  receviersPublicKey: PublicKey;
  privateKey: PrivateKey;
}): Promise<string> => {
  return encrypt({
    message: await createMessage({ text: message }),
    encryptionKeys: receviersPublicKey,
    signingKeys: privateKey,
  });
};

const decryptMessage = async ({
  ciphertext,
  sendersPublicKey,
  privateKey,
}: {
  ciphertext: string;
  sendersPublicKey: PublicKey;
  privateKey: PrivateKey;
}): Promise<{
  isValid: boolean;
  plaintext: string;
  signedBy: string;
}> => {
  const message = await readMessage({ armoredMessage: ciphertext });
  const { data: plaintext, signatures } = await decrypt({
    message,
    verificationKeys: sendersPublicKey,
    decryptionKeys: privateKey,
    expectSigned: true,
  });

  const signedBy = signatures[0].keyID.toHex();
  try {
    await signatures[0].verified;
    return { isValid: true, plaintext, signedBy };
  } catch (e) {
    return {
      isValid: false,
      plaintext,
      signedBy: signedBy || "missing signature",
    };
  }
};

export {
  type ImportKeyProps,
  encryptMessage,
  decryptMessage,
  genKey,
  importPublicKey,
  importPrivateKey,
  signClearTextMessage,
  signMessage,
  verifyDetachedSignature,
  verifySignedMessage,
};
