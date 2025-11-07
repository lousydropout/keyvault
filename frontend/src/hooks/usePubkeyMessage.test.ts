import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePubkeyMessage, isContext, Context } from "./usePubkeyMessage";

describe("usePubkeyMessage", () => {
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

  it("should return null initially", () => {
    const { result } = renderHook(() => usePubkeyMessage());

    expect(result.current).toBe(null);
  });

  it("should set up message event listener on mount", () => {
    renderHook(() => usePubkeyMessage());

    expect(window.addEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function)
    );
  });

  it("should clean up message event listener on unmount", () => {
    const { unmount } = renderHook(() => usePubkeyMessage());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function)
    );
  });

  it("should update context when receiving valid FROM_EXTENSION message", () => {
    const { result } = renderHook(() => usePubkeyMessage());

    const validContext: Context = {
      pubkey: "0x1234567890abcdef1234567890abcdef12345678",
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      chainId: 1,
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

    expect(result.current).toEqual(validContext);
  });

  it("should overwrite context on new message", () => {
    const { result } = renderHook(() => usePubkeyMessage());

    const initialContext: Context = {
      pubkey: "0x1111111111111111111111111111111111111111",
      address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      chainId: 1,
    };

    const updateContext: Context = {
      pubkey: "0x2222222222222222222222222222222222222222",
      address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      chainId: 2,
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

    // Update context
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

    expect(result.current).toEqual(updateContext);
  });

  it("should ignore messages with wrong type", () => {
    const { result } = renderHook(() => usePubkeyMessage());

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

    expect(result.current).toBe(null);
  });

  it("should ignore invalid context data", () => {
    const { result } = renderHook(() => usePubkeyMessage());

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

    expect(result.current).toBe(null);
  });
});

describe("isContext (usePubkeyMessage)", () => {
  it("should return true for valid context", () => {
    const validContext: Context = {
      pubkey: "0x1234567890abcdef1234567890abcdef12345678",
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      chainId: 1,
    };

    expect(isContext(validContext)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isContext(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isContext(undefined)).toBe(false);
  });

  it("should return false for object missing pubkey", () => {
    expect(
      isContext({
        address: "0x123",
        chainId: 1,
      })
    ).toBe(false);
  });

  it("should return false for object missing address", () => {
    expect(
      isContext({
        pubkey: "0x123",
        chainId: 1,
      })
    ).toBe(false);
  });

  it("should return false for object missing chainId", () => {
    expect(
      isContext({
        pubkey: "0x123",
        address: "0xabc",
      })
    ).toBe(false);
  });

  it("should return false for non-string pubkey", () => {
    expect(
      isContext({
        pubkey: 123,
        address: "0xabc",
        chainId: 1,
      })
    ).toBe(false);
  });

  it("should return false for non-number chainId", () => {
    expect(
      isContext({
        pubkey: "0x123",
        address: "0xabc",
        chainId: "1",
      } as any)
    ).toBe(false);
  });
});

