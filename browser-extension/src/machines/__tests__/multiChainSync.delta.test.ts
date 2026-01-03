import { describe, it, expect } from "bun:test";
import { calculateDeltaEntries } from "@/machines/multiChainSync.machine";
import { Encrypted } from "@/utils/encryption";

describe("calculateDeltaEntries", () => {
  const createEncrypted = (index: number): Encrypted => ({
    iv: `iv-${index}`,
    ciphertext: `ciphertext-${index}`,
  });

  it("returns empty array when target has same entries as source", () => {
    const sourceEncrypteds = [createEncrypted(0), createEncrypted(1)];
    const result = calculateDeltaEntries(sourceEncrypteds, 2);
    expect(result).toEqual([]);
  });

  it("returns empty array when target has more entries than source", () => {
    const sourceEncrypteds = [createEncrypted(0)];
    const result = calculateDeltaEntries(sourceEncrypteds, 5);
    expect(result).toEqual([]);
  });

  it("returns all entries when target has zero entries", () => {
    const sourceEncrypteds = [
      createEncrypted(0),
      createEncrypted(1),
      createEncrypted(2),
    ];
    const result = calculateDeltaEntries(sourceEncrypteds, 0);
    expect(result).toEqual(sourceEncrypteds);
  });

  it("returns missing entries when target is behind", () => {
    const sourceEncrypteds = [
      createEncrypted(0),
      createEncrypted(1),
      createEncrypted(2),
      createEncrypted(3),
      createEncrypted(4),
    ];
    const result = calculateDeltaEntries(sourceEncrypteds, 3);
    expect(result).toEqual([createEncrypted(3), createEncrypted(4)]);
    expect(result.length).toBe(2);
  });

  it("returns single entry when target is one behind", () => {
    const sourceEncrypteds = [createEncrypted(0), createEncrypted(1)];
    const result = calculateDeltaEntries(sourceEncrypteds, 1);
    expect(result).toEqual([createEncrypted(1)]);
  });

  it("handles empty source array", () => {
    const result = calculateDeltaEntries([], 0);
    expect(result).toEqual([]);
  });
});
