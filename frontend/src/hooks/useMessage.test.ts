import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMessage, isContext, isEncrypted, Context, Encrypted, MessageResult } from "./useMessage";

describe("useMessage", () => {
  let messageHandler: ((event: MessageEvent) => void) | null = null;

  beforeEach(() => {
    messageHandler = null;
    // Capture the event handler
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;
    window.addEventListener = vi.fn((event: string, handler: any) => {
      if (event === "message") {
        messageHandler = handler;
      }
      originalAddEventListener.call(window, event, handler);
    });
    window.removeEventListener = vi.fn((event: string, handler: any) => {
      originalRemoveEventListener.call(window, event, handler);
    });
  });

  it("should return empty queue initially", () => {
    const { result } = renderHook(() => useMessage());

    expect(result.current.queue).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.remaining).toBe(0);
    expect(typeof result.current.advance).toBe("function");
  });

  it("should set up message event listener on mount", () => {
    renderHook(() => useMessage());

    expect(window.addEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function)
    );
  });

  it("should clean up message event listener on unmount", () => {
    const { unmount } = renderHook(() => useMessage());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function)
    );
  });

  it("should add to queue when receiving valid FROM_EXTENSION message", () => {
    const { result } = renderHook(() => useMessage());

    const validContext: Context = {
      address: "0x1234567890abcdef1234567890abcdef12345678",
      chainId: 1,
      encrypted: {
        iv: "abcdefghijklmnop",
        ciphertext: "ciphertext",
      },
      numEntries: 5,
    };

    const message = {
      type: "FROM_EXTENSION" as const,
      channelName: "test",
      data: validContext,
    };

    act(() => {
      if (messageHandler) {
        const event = new MessageEvent("message", {
          data: message,
          origin: window.location.origin,
        });
        messageHandler(event);
      }
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0]).toEqual(validContext);
    expect(result.current.total).toBe(1);
    expect(result.current.remaining).toBe(1);
  });

  it("should replace queue with new context (no merging)", () => {
    const { result } = renderHook(() => useMessage());

    const initialContext: Context = {
      address: "0x1111111111111111111111111111111111111111",
      chainId: 1,
      encrypted: {
        iv: "initialiv",
        ciphertext: "initialcipher",
      },
      numEntries: 3,
    };

    const updateContext: Context = {
      address: "0x2222222222222222222222222222222222222222",
      chainId: 2,
      encrypted: {
        iv: "updateiv",
        ciphertext: "updatecipher",
      },
      numEntries: 7,
      overwrite: false,
    };

    // Set initial context
    act(() => {
      if (messageHandler) {
        const event1 = new MessageEvent("message", {
          data: {
            type: "FROM_EXTENSION",
            channelName: "test",
            data: initialContext,
          },
          origin: window.location.origin,
        });
        messageHandler(event1);
      }
    });

    // Update replaces the queue
    act(() => {
      if (messageHandler) {
        const event2 = new MessageEvent("message", {
          data: {
            type: "FROM_EXTENSION",
            channelName: "test",
            data: updateContext,
          },
          origin: window.location.origin,
        });
        messageHandler(event2);
      }
    });

    // Queue should contain only the latest context
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].address).toBe(updateContext.address);
    expect(result.current.queue[0].chainId).toBe(updateContext.chainId);
    expect(result.current.queue[0].encrypted).toEqual(updateContext.encrypted);
    expect(result.current.queue[0].numEntries).toBe(updateContext.numEntries);
  });

  it("should replace queue when overwrite is true", () => {
    const { result } = renderHook(() => useMessage());

    const initialContext: Context = {
      address: "0x1111111111111111111111111111111111111111",
      chainId: 1,
      encrypted: {
        iv: "initialiv",
        ciphertext: "initialcipher",
      },
      numEntries: 3,
    };

    const overwriteContext: Context = {
      address: "0x2222222222222222222222222222222222222222",
      chainId: 2,
      encrypted: {
        iv: "overwriteiv",
        ciphertext: "overwritecipher",
      },
      numEntries: 10,
      overwrite: true,
    };

    // Set initial context
    act(() => {
      if (messageHandler) {
        const event1 = new MessageEvent("message", {
          data: {
            type: "FROM_EXTENSION",
            channelName: "test",
            data: initialContext,
          },
          origin: window.location.origin,
        });
        messageHandler(event1);
      }
    });

    // Overwrite
    act(() => {
      if (messageHandler) {
        const event2 = new MessageEvent("message", {
          data: {
            type: "FROM_EXTENSION",
            channelName: "test",
            data: overwriteContext,
          },
          origin: window.location.origin,
        });
        messageHandler(event2);
      }
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0]).toEqual(overwriteContext);
  });

  it("should ignore messages with wrong type", () => {
    const { result } = renderHook(() => useMessage());

    act(() => {
      if (messageHandler) {
        const event = new MessageEvent("message", {
          data: {
            type: "TO_EXTENSION",
            channelName: "test",
            data: {},
          },
          origin: window.location.origin,
        });
        messageHandler(event);
      }
    });

    expect(result.current.queue).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("should ignore invalid context data", () => {
    const { result } = renderHook(() => useMessage());

    act(() => {
      if (messageHandler) {
        const event = new MessageEvent("message", {
          data: {
            type: "FROM_EXTENSION",
            channelName: "test",
            data: {
              invalid: "data",
            },
          },
          origin: window.location.origin,
        });
        messageHandler(event);
      }
    });

    expect(result.current.queue).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("should advance queue correctly", () => {
    const { result } = renderHook(() => useMessage());

    const batchData = {
      encrypteds: [
        { iv: "iv1", ciphertext: "ct1" },
        { iv: "iv2", ciphertext: "ct2" },
        { iv: "iv3", ciphertext: "ct3" },
      ],
      address: "0x1234567890abcdef1234567890abcdef12345678",
      startIndex: 0,
      chainId: 1,
    };

    act(() => {
      if (messageHandler) {
        const event = new MessageEvent("message", {
          data: {
            type: "FROM_EXTENSION",
            channelName: "test",
            data: batchData,
          },
          origin: window.location.origin,
        });
        messageHandler(event);
      }
    });

    expect(result.current.queue).toHaveLength(3);
    expect(result.current.total).toBe(3);
    expect(result.current.remaining).toBe(3);

    // Advance by 2
    act(() => {
      result.current.advance(2);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.remaining).toBe(1);
    expect(result.current.queue[0].encrypted).toEqual({ iv: "iv3", ciphertext: "ct3" });
  });

  it("should handle batch data format", () => {
    const { result } = renderHook(() => useMessage());

    const batchData = {
      encrypteds: [
        { iv: "iv1", ciphertext: "ct1" },
        { iv: "iv2", ciphertext: "ct2" },
      ],
      address: "0x1234567890abcdef1234567890abcdef12345678",
      startIndex: 5,
      chainId: 1,
    };

    act(() => {
      if (messageHandler) {
        const event = new MessageEvent("message", {
          data: {
            type: "FROM_EXTENSION",
            channelName: "test",
            data: batchData,
          },
          origin: window.location.origin,
        });
        messageHandler(event);
      }
    });

    expect(result.current.queue).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.queue[0].numEntries).toBe(5); // startIndex + 0
    expect(result.current.queue[1].numEntries).toBe(6); // startIndex + 1
  });
});

describe("isContext", () => {
  it("should return true for valid context", () => {
    const validContext: Context = {
      address: "0x1234567890abcdef1234567890abcdef12345678",
      chainId: 1,
      encrypted: {
        iv: "abcdefghijklmnop",
        ciphertext: "ciphertext",
      },
      numEntries: 5,
    };

    expect(isContext(validContext)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isContext(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isContext(undefined)).toBe(false);
  });

  it("should return false for object missing address", () => {
    expect(
      isContext({
        chainId: 1,
        encrypted: { iv: "iv", ciphertext: "ct" },
        numEntries: 5,
      })
    ).toBe(false);
  });

  it("should return false for object missing chainId", () => {
    expect(
      isContext({
        address: "0x123",
        encrypted: { iv: "iv", ciphertext: "ct" },
        numEntries: 5,
      })
    ).toBe(false);
  });

  it("should return false for object with invalid encrypted", () => {
    expect(
      isContext({
        address: "0x123",
        chainId: 1,
        encrypted: { invalid: "data" },
        numEntries: 5,
      })
    ).toBe(false);
  });

  it("should return true for context with overwrite flag", () => {
    const context: Context = {
      address: "0x123",
      chainId: 1,
      encrypted: { iv: "iv", ciphertext: "ct" },
      numEntries: 5,
      overwrite: true,
    };

    expect(isContext(context)).toBe(true);
  });
});

describe("isEncrypted", () => {
  it("should return true for valid encrypted object", () => {
    const encrypted: Encrypted = {
      iv: "abcdefghijklmnop",
      ciphertext: "ciphertext",
    };

    expect(isEncrypted(encrypted)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isEncrypted(null)).toBe(false);
  });

  it("should return false for object missing iv", () => {
    expect(isEncrypted({ ciphertext: "ct" })).toBe(false);
  });

  it("should return false for object missing ciphertext", () => {
    expect(isEncrypted({ iv: "iv" })).toBe(false);
  });

  it("should return false for non-string iv", () => {
    expect(isEncrypted({ iv: 123, ciphertext: "ct" })).toBe(false);
  });

  it("should return false for non-string ciphertext", () => {
    expect(isEncrypted({ iv: "iv", ciphertext: 123 })).toBe(false);
  });
});

