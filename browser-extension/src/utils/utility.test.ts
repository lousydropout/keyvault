import { describe, it, expect } from "bun:test";
import { objToArray, arrayToObj, createKeyShortener } from "@/utils/utility";

describe("objToArray", () => {
  it("should convert object to array based on key index", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const keyIndex = ["a", "b", "c"] as const;
    const result = objToArray(obj, keyIndex);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should return null for missing keys", () => {
    const obj = { a: 1, c: 3 };
    const keyIndex = ["a", "b", "c"] as const;
    const result = objToArray(obj, keyIndex);
    expect(result).toEqual([1, null, 3]);
  });

  it("should preserve undefined values as null", () => {
    const obj = { a: undefined, b: 2 };
    const keyIndex = ["a", "b"] as const;
    const result = objToArray(obj, keyIndex);
    expect(result).toEqual([null, 2]);
  });

  it("should handle empty object", () => {
    const obj = {};
    const keyIndex = ["a", "b"] as const;
    const result = objToArray(obj, keyIndex);
    expect(result).toEqual([null, null]);
  });

  it("should handle empty key index", () => {
    const obj = { a: 1 };
    const keyIndex: readonly string[] = [];
    const result = objToArray(obj, keyIndex);
    expect(result).toEqual([]);
  });

  it("should handle nested objects", () => {
    const obj = { a: { nested: true }, b: [1, 2, 3] };
    const keyIndex = ["a", "b"] as const;
    const result = objToArray(obj, keyIndex);
    expect(result).toEqual([{ nested: true }, [1, 2, 3]]);
  });

  it("should handle null values", () => {
    const obj = { a: null, b: 2 };
    const keyIndex = ["a", "b"] as const;
    const result = objToArray(obj, keyIndex);
    expect(result).toEqual([null, 2]);
  });

  it("should handle falsy values correctly", () => {
    const obj = { a: 0, b: "", c: false };
    const keyIndex = ["a", "b", "c"] as const;
    const result = objToArray(obj, keyIndex);
    expect(result).toEqual([0, "", false]);
  });
});

describe("arrayToObj", () => {
  it("should convert array to object based on key index", () => {
    const arr = [1, 2, 3];
    const keyIndex = ["a", "b", "c"] as const;
    const result = arrayToObj(arr, keyIndex);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("should skip null values", () => {
    const arr = [1, null, 3];
    const keyIndex = ["a", "b", "c"] as const;
    const result = arrayToObj(arr, keyIndex);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it("should handle empty array", () => {
    const arr: any[] = [];
    const keyIndex = ["a", "b"] as const;
    const result = arrayToObj(arr, keyIndex);
    expect(result).toEqual({});
  });

  it("should handle array shorter than key index", () => {
    const arr = [1];
    const keyIndex = ["a", "b", "c"] as const;
    const result = arrayToObj(arr, keyIndex);
    expect(result).toEqual({ a: 1 });
  });

  it("should preserve falsy values except null", () => {
    const arr = [0, "", false];
    const keyIndex = ["a", "b", "c"] as const;
    const result = arrayToObj(arr, keyIndex);
    expect(result).toEqual({ a: 0, b: "", c: false });
  });

  it("should handle nested objects", () => {
    const arr = [{ nested: true }, [1, 2, 3]];
    const keyIndex = ["a", "b"] as const;
    const result = arrayToObj(arr, keyIndex);
    expect(result).toEqual({ a: { nested: true }, b: [1, 2, 3] });
  });
});

describe("createKeyShortener", () => {
  const keyIndex = ["name", "url", "username", "password", "notes"] as const;
  const shortener = createKeyShortener(keyIndex);

  describe("shorten", () => {
    it("should shorten object to array", () => {
      const obj = {
        name: "Test",
        url: "example.com",
        username: "user",
        password: "pass",
        notes: "note",
      };
      const result = shortener.shorten(obj);
      expect(result).toEqual(["Test", "example.com", "user", "pass", "note"]);
    });

    it("should trim trailing nulls", () => {
      const obj = {
        name: "Test",
        url: "example.com",
      };
      const result = shortener.shorten(obj);
      expect(result).toEqual(["Test", "example.com"]);
    });

    it("should preserve middle nulls", () => {
      const obj = {
        name: "Test",
        password: "pass",
      };
      const result = shortener.shorten(obj);
      expect(result).toEqual(["Test", null, null, "pass"]);
    });

    it("should return empty array for empty object", () => {
      const obj = {};
      const result = shortener.shorten(obj);
      expect(result).toEqual([]);
    });

    it("should handle object with only last field", () => {
      const obj = { notes: "note" };
      const result = shortener.shorten(obj);
      expect(result).toEqual([null, null, null, null, "note"]);
    });
  });

  describe("recover", () => {
    it("should recover object from array", () => {
      const arr = ["Test", "example.com", "user", "pass", "note"];
      const result = shortener.recover(arr);
      expect(result).toEqual({
        name: "Test",
        url: "example.com",
        username: "user",
        password: "pass",
        notes: "note",
      });
    });

    it("should recover partial object from shortened array", () => {
      const arr = ["Test", "example.com"];
      const result = shortener.recover(arr);
      expect(result).toEqual({
        name: "Test",
        url: "example.com",
      });
    });

    it("should skip null values during recovery", () => {
      const arr = ["Test", null, null, "pass"];
      const result = shortener.recover(arr);
      expect(result).toEqual({
        name: "Test",
        password: "pass",
      });
    });

    it("should return empty object for empty array", () => {
      const arr: any[] = [];
      const result = shortener.recover(arr);
      expect(result).toEqual({});
    });
  });

  describe("roundtrip", () => {
    it("should preserve data through shorten->recover cycle", () => {
      const original = {
        name: "GitHub",
        url: "github.com",
        username: "user@email.com",
        password: "secret123",
        notes: "Personal account",
      };
      const shortened = shortener.shorten(original);
      const recovered = shortener.recover(shortened);
      expect(recovered).toEqual(original);
    });

    it("should preserve partial data through roundtrip", () => {
      const original = {
        name: "Test Site",
        url: "test.com",
      };
      const shortened = shortener.shorten(original);
      const recovered = shortener.recover(shortened);
      expect(recovered).toEqual(original);
    });

    it("should preserve sparse data through roundtrip", () => {
      const original = {
        name: "Sparse",
        notes: "Only name and notes",
      };
      const shortened = shortener.shorten(original);
      const recovered = shortener.recover(shortened);
      expect(recovered).toEqual(original);
    });
  });
});
