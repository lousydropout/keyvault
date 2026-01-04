import { describe, it, expect } from "vitest";
import { cn, formatAddress } from "./utils";

describe("cn (className utility)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "conditional")).toBe("base conditional");
    expect(cn("base", false && "conditional")).toBe("base");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles objects with boolean values", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("formatAddress", () => {
  describe("valid addresses", () => {
    it("formats standard Ethereum address", () => {
      const address = "0x1234567890abcdef1234567890abcdef12345678";
      expect(formatAddress(address)).toBe("0x12...5678");
    });

    it("formats minimum valid length address (10 chars)", () => {
      const address = "0x12345678";
      expect(formatAddress(address)).toBe("0x12...5678");
    });

    it("preserves case", () => {
      const address = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";
      expect(formatAddress(address)).toBe("0xAb...Ef12");
    });
  });

  describe("invalid addresses", () => {
    it("throws for address shorter than 10 characters", () => {
      expect(() => formatAddress("0x123456")).toThrow("Invalid address length");
    });

    it("throws for empty string", () => {
      expect(() => formatAddress("")).toThrow("Invalid address length");
    });

    it("throws for non-string input", () => {
      // @ts-expect-error Testing runtime behavior
      expect(() => formatAddress(null)).toThrow();
      // @ts-expect-error Testing runtime behavior
      expect(() => formatAddress(undefined)).toThrow();
    });
  });

  describe("output format", () => {
    it("output is always 11 characters", () => {
      const addresses = [
        "0x1234567890",
        "0x1234567890abcdef1234567890abcdef12345678",
      ];
      addresses.forEach((addr) => {
        expect(formatAddress(addr).length).toBe(11);
      });
    });
  });
});
