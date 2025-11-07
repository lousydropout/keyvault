// Taken from https://github.com/paritytech/banana_split/blob/master/src/util/crypto.ts
import base64 from "base64-js";
import crypto from "tweetnacl";
import scrypt from "scryptsy";
import secrets from "secrets.js-grempe";

export type Shard = {
  data: string;
  version: number;
  title: string;
  nonce: string;
  requiredShards: number;
};

type EncryptedData = {
  value: Uint8Array;
  nonce: Uint8Array;
  salt: Uint8Array;
};

const HexEncodeArray = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
];

function strToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function uint8ArrayToStr(arr: Uint8Array): string {
  return new TextDecoder("utf-8").decode(arr);
}

function hashString(str: string): Uint8Array {
  return crypto.hash(strToUint8Array(str));
}

function hexify(arr: Uint8Array): string {
  let s = "";
  for (let i = 0; i < arr.length; i++) {
    // `i` is a numerical counter for the loop and is never changed outside of there
    // therefore `i` is numerical, and is safe to use as an array index
    // eslint-disable-next-line security/detect-object-injection
    const code = arr[i];
    s += HexEncodeArray[code >>> 4];
    s += HexEncodeArray[code & 0x0f];
  }
  return s;
}

function dehexify(str: string): Uint8Array {
  const arr = new Uint8Array(str.length / 2);
  for (let i = 0; i < arr.length; i++) {
    // `i` is a numerical counter for the loop and is never changed outside of there
    // therefore `i` is numerical, and is safe to use as an array index
    // eslint-disable-next-line security/detect-object-injection
    arr[i] = parseInt(str.slice(2 * i, 2 * i + 2), 16);
  }
  return arr;
}

function encrypt(
  data: string,
  salt: Uint8Array,
  passphrase: string
): EncryptedData {
  // Ensure salt buffer is a proper ArrayBuffer for Buffer.from
  const saltArray = salt.buffer instanceof ArrayBuffer
    ? salt
    : new Uint8Array(salt);
  const keyBuffer = scrypt(passphrase, Buffer.from(saltArray), 1 << 15, 8, 1, 32);
  // Convert Buffer to Uint8Array for tweetnacl
  const key = new Uint8Array(keyBuffer);
  const nonce = crypto.randomBytes(24);
  return {
    nonce,
    salt,
    value: crypto.secretbox(strToUint8Array(data), nonce, key),
  };
}

function decrypt(
  data: Uint8Array,
  salt: Uint8Array,
  passphrase: string,
  nonce: Uint8Array
): Uint8Array | null {
  // Ensure salt buffer is a proper ArrayBuffer for Buffer.from
  const saltArray = salt.buffer instanceof ArrayBuffer
    ? salt
    : new Uint8Array(salt);
  const keyBuffer = scrypt(passphrase, Buffer.from(saltArray), 1 << 15, 8, 1, 32);
  // Convert Buffer to Uint8Array for tweetnacl
  const key = new Uint8Array(keyBuffer);
  // This is a false positive, `secretbox.open` is unrelated to `fs.open`
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return crypto.secretbox.open(data, nonce, key);
}

/**
 * Shares the given data using Shamir Secret Sharing algorithm.
 *
 * @param data - The data to be shared.
 * @param title - The title of the shared data.
 * @param passphrase - The passphrase used for encryption.
 * @param totalShards - The total number of shards to be generated.
 * @param requiredShards - The minimum number of shards required to reconstruct the data.
 * @returns An array of strings representing the shared shards.
 */
function share({
  data,
  title,
  passphrase,
  totalShards,
  requiredShards,
}: {
  data: string;
  title: string;
  passphrase: string;
  totalShards: number;
  requiredShards: number;
}): string[] {
  const salt = hashString(title),
    encrypted = encrypt(data, salt, passphrase),
    nonce = base64.fromByteArray(encrypted.nonce),
    hexEncrypted = hexify(encrypted.value);
  return secrets
    .share(hexEncrypted, totalShards, requiredShards)
    .map(function (shard: string) {
      // First char is non-hex (base36) and signifies the bitfield size of our share
      const encodedShard =
        shard[0] + base64.fromByteArray(dehexify(shard.slice(1)));

      return JSON.stringify({
        v: 1,
        t: title,
        r: requiredShards,
        d: encodedShard,
        n: nonce,
      }).replace(/[\u007F-\uFFFF]/g, function (chr) {
        return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4);
      });
    });
}

/**
 * Parses a payload string and returns a Shard object.
 *
 * @param payload - The payload string to parse.
 * @returns The parsed Shard object.
 */
function parse(payload: string): Shard {
  let parsed = JSON.parse(payload);
  return {
    version: parsed.v || 0, // 'undefined' version is treated as 0
    title: parsed.t,
    requiredShards: parsed.r,
    data: parsed.d,
    nonce: parsed.n,
  };
}

/**
 * Reconstructs a secret using Shamir Secret Sharing algorithm.
 *
 * @param shardObjects - An array of shard objects containing the necessary information for reconstruction.
 * @param passphrase - The passphrase used for decryption.
 * @returns The reconstructed secret as a string.
 * @throws {string} If there is a mismatch in the minimum shard requirements among shards.
 * @throws {string} If there are not enough shards provided.
 * @throws {string} If there is a mismatch in the nonces among shards.
 * @throws {string} If there is a mismatch in the titles among shards.
 * @throws {string} If there is a mismatch in the versions among shards.
 * @throws {string} If the version is not supported.
 * @throws {string} If unable to decrypt the secret.
 */
function reconstruct(shardObjects: Shard[], passphrase: string): string {
  const shardsRequirements = shardObjects.map((shard) => shard.requiredShards);
  if (!shardsRequirements.every((r) => r === shardsRequirements[0])) {
    throw "Mismatching min shards requirement among shards!";
  }
  if (shardObjects.length < shardsRequirements[0]) {
    throw `Not enough shards, need ${shardsRequirements[0]} but only ${shardObjects.length} provided`;
  }

  const nonces = shardObjects.map((shard) => shard.nonce);
  if (!nonces.every((n) => n === nonces[0])) {
    throw "Nonces mismatch among shards!";
  }

  const titles = shardObjects.map((shard) => shard.title);
  if (!titles.every((t) => t === titles[0])) {
    throw "Titles mismatch among shards!";
  }

  const versions = shardObjects.map((shard) => shard.version);
  if (!versions.every((v) => v === versions[0])) {
    throw "Versions mismatch along shards!";
  }

  let decryptedMsg: Uint8Array | null;

  switch (versions[0]) {
    case 0: {
      const shardData = shardObjects.map((shard) => shard.data);
      const encryptedSecret = secrets.combine(shardData);
      const secret = dehexify(encryptedSecret);
      const nonce = dehexify(nonces[0]);
      const salt = hashString(titles[0]);
      decryptedMsg = decrypt(secret, salt, passphrase, nonce);
      break;
    }
    case 1: {
      const shardDataV1 = shardObjects.map(
        (shard) =>
          shard.data[0] + hexify(base64.toByteArray(shard.data.slice(1)))
      );
      const encryptedSecretV1 = secrets.combine(shardDataV1);
      const secretV1 = dehexify(encryptedSecretV1);
      const nonceV1 = base64.toByteArray(nonces[0]);
      const saltV1 = hashString(titles[0]);
      decryptedMsg = decrypt(secretV1, saltV1, passphrase, nonceV1);
      break;
    }
    default:
      throw "Version is not supported!";
  }
  if (!decryptedMsg) {
    throw "Unable to decrypt the secret";
  }
  return uint8ArrayToStr(decryptedMsg);
}

export { share, parse, reconstruct };
