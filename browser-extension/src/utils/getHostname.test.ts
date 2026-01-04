import { describe, it, expect, mock, beforeEach } from "bun:test";
import { getHostname } from "@/utils/getHostname";

// Mock the logger to prevent console output during tests
mock.module("@/utils/logger", () => ({
  logger: {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  },
}));

describe("getHostname", () => {
  describe("with string URL input", () => {
    it("should extract hostname from simple URL", () => {
      const result = getHostname("https://example.com");
      expect(result).toBe("example.com");
    });

    it("should extract hostname from URL with path", () => {
      const result = getHostname("https://example.com/path/to/page");
      expect(result).toBe("example.com");
    });

    it("should extract hostname from URL with query params", () => {
      const result = getHostname("https://example.com?param=value");
      expect(result).toBe("example.com");
    });

    it("should strip subdomain from multi-part hostname", () => {
      const result = getHostname("https://www.example.com");
      expect(result).toBe("example.com");
    });

    it("should strip nested subdomains", () => {
      const result = getHostname("https://sub.www.example.com");
      expect(result).toBe("www.example.com");
    });

    it("should handle deep subdomain chains", () => {
      const result = getHostname("https://a.b.c.example.com");
      expect(result).toBe("b.c.example.com");
    });

    it("should preserve two-part hostnames", () => {
      const result = getHostname("https://localhost.local");
      expect(result).toBe("localhost.local");
    });

    it("should handle HTTP URLs", () => {
      const result = getHostname("http://example.com");
      expect(result).toBe("example.com");
    });

    it("should handle URLs with port numbers", () => {
      const result = getHostname("https://example.com:8080");
      expect(result).toBe("example.com");
    });

    it("should return null for invalid URL", () => {
      const result = getHostname("not-a-valid-url");
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = getHostname("");
      expect(result).toBeNull();
    });
  });

  describe("with chrome.tabs.Tab object input", () => {
    it("should extract hostname from tab with URL", () => {
      const tab = { url: "https://example.com/page" } as chrome.tabs.Tab;
      const result = getHostname(tab);
      expect(result).toBe("example.com");
    });

    it("should strip subdomain from tab URL", () => {
      const tab = { url: "https://www.github.com/repo" } as chrome.tabs.Tab;
      const result = getHostname(tab);
      expect(result).toBe("github.com");
    });

    it("should return null for tab without URL", () => {
      const tab = {} as chrome.tabs.Tab;
      const result = getHostname(tab);
      expect(result).toBeNull();
    });

    it("should return null for tab with invalid URL", () => {
      const tab = { url: "invalid-url" } as chrome.tabs.Tab;
      const result = getHostname(tab);
      expect(result).toBeNull();
    });

    it("should handle tab with chrome:// URL", () => {
      const tab = { url: "chrome://extensions" } as chrome.tabs.Tab;
      const result = getHostname(tab);
      expect(result).toBe("extensions");
    });
  });

  describe("with undefined input", () => {
    it("should return null for undefined", () => {
      const result = getHostname(undefined);
      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle localhost", () => {
      const result = getHostname("http://localhost:3000");
      expect(result).toBe("localhost");
    });

    it("should handle IP address", () => {
      const result = getHostname("http://192.168.1.1");
      expect(result).toBe("168.1.1");
    });

    it("should handle co.uk style domains", () => {
      const result = getHostname("https://www.example.co.uk");
      expect(result).toBe("example.co.uk");
    });
  });
});
