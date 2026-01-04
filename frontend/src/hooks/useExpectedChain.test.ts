import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExpectedChain } from "./useExpectedChain";
import { DEFAULT_CHAIN_ID, CHAIN_CONFIGS } from "@/chainConfig";

// Store original location
const originalLocation = window.location;

// Helper to set URL
const setUrl = (url: string) => {
  Object.defineProperty(window, "location", {
    value: new URL(url),
    writable: true,
  });
};

describe("useExpectedChain", () => {
  beforeEach(() => {
    // Reset to default URL
    setUrl("http://localhost:3000/");
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  describe("URL parsing", () => {
    it("returns default chain when no query param", () => {
      setUrl("http://localhost:3000/");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID);
      expect(result.current.chainName).toBe(CHAIN_CONFIGS[DEFAULT_CHAIN_ID].name);
      expect(result.current.isFromUrl).toBe(false);
    });

    it("parses base_8453 chain param correctly", () => {
      setUrl("http://localhost:3000/?chain=base_8453");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(8453);
      expect(result.current.chainName).toBe("Base");
      expect(result.current.isFromUrl).toBe(true);
    });

    it("parses astar_592 chain param correctly", () => {
      setUrl("http://localhost:3000/?chain=astar_592");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(592);
      expect(result.current.chainName).toBe("Astar");
      expect(result.current.isFromUrl).toBe(true);
    });

    it("parses localhost_31337 chain param correctly", () => {
      setUrl("http://localhost:3000/?chain=localhost_31337");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(31337);
      expect(result.current.chainName).toBe("Localhost");
      expect(result.current.isFromUrl).toBe(true);
    });

    it("handles chain param with underscores in name", () => {
      // The ID is always the last part after splitting by underscore
      setUrl("http://localhost:3000/?chain=some_weird_name_8453");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(8453);
      expect(result.current.isFromUrl).toBe(true);
    });

    it("handles multiple query params", () => {
      setUrl("http://localhost:3000/?foo=bar&chain=base_8453&baz=qux");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(8453);
      expect(result.current.isFromUrl).toBe(true);
    });
  });

  describe("invalid chain params", () => {
    it("falls back to default for invalid chain ID", () => {
      setUrl("http://localhost:3000/?chain=fake_99999");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID);
      expect(result.current.isFromUrl).toBe(false);
    });

    it("falls back to default for non-numeric ID", () => {
      setUrl("http://localhost:3000/?chain=base_notanumber");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID);
      expect(result.current.isFromUrl).toBe(false);
    });

    it("falls back to default for malformed param (no underscore)", () => {
      setUrl("http://localhost:3000/?chain=8453");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID);
      expect(result.current.isFromUrl).toBe(false);
    });

    it("falls back to default for empty chain param", () => {
      setUrl("http://localhost:3000/?chain=");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID);
      expect(result.current.isFromUrl).toBe(false);
    });

    it("falls back to default for chain param with only underscore", () => {
      setUrl("http://localhost:3000/?chain=_");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID);
      expect(result.current.isFromUrl).toBe(false);
    });
  });

  describe("URL change subscription", () => {
    it("updates when popstate event fires", () => {
      setUrl("http://localhost:3000/?chain=base_8453");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current.chainId).toBe(8453);

      // Simulate URL change via popstate
      act(() => {
        setUrl("http://localhost:3000/?chain=astar_592");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(result.current.chainId).toBe(592);
      expect(result.current.chainName).toBe("Astar");
    });

    it("cleans up popstate listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useExpectedChain());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "popstate",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe("memoization", () => {
    it("returns same object reference when URL unchanged", () => {
      setUrl("http://localhost:3000/?chain=base_8453");

      const { result, rerender } = renderHook(() => useExpectedChain());

      const firstResult = result.current;

      rerender();

      // Should be same reference due to useMemo
      expect(result.current).toBe(firstResult);
    });
  });

  describe("return type", () => {
    it("returns correct shape", () => {
      setUrl("http://localhost:3000/?chain=base_8453");

      const { result } = renderHook(() => useExpectedChain());

      expect(result.current).toHaveProperty("chainId");
      expect(result.current).toHaveProperty("chainName");
      expect(result.current).toHaveProperty("isFromUrl");

      expect(typeof result.current.chainId).toBe("number");
      expect(typeof result.current.chainName).toBe("string");
      expect(typeof result.current.isFromUrl).toBe("boolean");
    });
  });
});
