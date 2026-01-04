import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, toast, reducer } from "./use-toast";

describe("toast reducer", () => {
  const createToast = (id: string, title?: string) => ({
    id,
    title,
    open: true,
    onOpenChange: vi.fn(),
  });

  describe("ADD_TOAST", () => {
    it("adds toast to empty state", () => {
      const state = { toasts: [] };
      const newToast = createToast("1", "Test");

      const result = reducer(state, { type: "ADD_TOAST", toast: newToast });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe("1");
    });

    it("adds toast to front of list (respecting TOAST_LIMIT of 1)", () => {
      const state = { toasts: [createToast("1", "First")] };
      const newToast = createToast("2", "Second");

      const result = reducer(state, { type: "ADD_TOAST", toast: newToast });

      // TOAST_LIMIT is 1, so only newest toast should remain
      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe("2");
    });
  });

  describe("UPDATE_TOAST", () => {
    it("updates existing toast", () => {
      const state = { toasts: [createToast("1", "Original")] };

      const result = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "Updated" },
      });

      expect(result.toasts[0].title).toBe("Updated");
    });

    it("does not affect non-matching toasts", () => {
      const state = {
        toasts: [createToast("1", "First"), createToast("2", "Second")],
      };

      const result = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "Updated" },
      });

      expect(result.toasts[0].title).toBe("Updated");
      expect(result.toasts[1].title).toBe("Second");
    });

    it("preserves other properties when updating", () => {
      const originalToast = { ...createToast("1", "Title"), description: "Desc" };
      const state = { toasts: [originalToast] };

      const result = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "New Title" },
      });

      expect(result.toasts[0].title).toBe("New Title");
      expect(result.toasts[0].description).toBe("Desc");
    });
  });

  describe("DISMISS_TOAST", () => {
    it("sets open to false for specific toast", () => {
      const state = { toasts: [createToast("1", "Test")] };

      const result = reducer(state, { type: "DISMISS_TOAST", toastId: "1" });

      expect(result.toasts[0].open).toBe(false);
    });

    it("dismisses all toasts when no toastId provided", () => {
      const state = {
        toasts: [createToast("1", "First"), createToast("2", "Second")],
      };

      const result = reducer(state, { type: "DISMISS_TOAST" });

      expect(result.toasts[0].open).toBe(false);
      expect(result.toasts[1].open).toBe(false);
    });

    it("only dismisses matching toast", () => {
      const state = {
        toasts: [createToast("1", "First"), createToast("2", "Second")],
      };

      const result = reducer(state, { type: "DISMISS_TOAST", toastId: "1" });

      expect(result.toasts[0].open).toBe(false);
      expect(result.toasts[1].open).toBe(true);
    });
  });

  describe("REMOVE_TOAST", () => {
    it("removes specific toast", () => {
      const state = { toasts: [createToast("1", "Test")] };

      const result = reducer(state, { type: "REMOVE_TOAST", toastId: "1" });

      expect(result.toasts).toHaveLength(0);
    });

    it("removes all toasts when no toastId provided", () => {
      const state = {
        toasts: [createToast("1", "First"), createToast("2", "Second")],
      };

      const result = reducer(state, { type: "REMOVE_TOAST" });

      expect(result.toasts).toHaveLength(0);
    });

    it("only removes matching toast", () => {
      const state = {
        toasts: [createToast("1", "First"), createToast("2", "Second")],
      };

      const result = reducer(state, { type: "REMOVE_TOAST", toastId: "1" });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe("2");
    });
  });
});

describe("toast function", () => {
  beforeEach(() => {
    // Clear any existing toasts by rendering hook and dismissing
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss();
    });
  });

  it("creates a toast and returns id", () => {
    const result = toast({ title: "Test Toast" });

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
  });

  it("returns dismiss function", () => {
    const result = toast({ title: "Test Toast" });

    expect(typeof result.dismiss).toBe("function");
  });

  it("returns update function", () => {
    const result = toast({ title: "Test Toast" });

    expect(typeof result.update).toBe("function");
  });

  it("generates unique IDs", () => {
    const toast1 = toast({ title: "Toast 1" });
    const toast2 = toast({ title: "Toast 2" });

    expect(toast1.id).not.toBe(toast2.id);
  });
});

describe("useToast hook", () => {
  beforeEach(() => {
    // Clear toasts between tests
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss();
    });
  });

  it("returns toasts array", () => {
    const { result } = renderHook(() => useToast());

    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it("returns toast function", () => {
    const { result } = renderHook(() => useToast());

    expect(typeof result.current.toast).toBe("function");
  });

  it("returns dismiss function", () => {
    const { result } = renderHook(() => useToast());

    expect(typeof result.current.dismiss).toBe("function");
  });

  it("updates state when toast is added", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "New Toast" });
    });

    expect(result.current.toasts.length).toBeGreaterThan(0);
  });

  it("clears toasts when dismiss called without id", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Toast 1" });
    });

    act(() => {
      result.current.dismiss();
    });

    // After dismiss, toasts should be marked as closed
    expect(result.current.toasts.every((t) => t.open === false)).toBe(true);
  });

  it("multiple hooks share same state", () => {
    const { result: result1 } = renderHook(() => useToast());
    const { result: result2 } = renderHook(() => useToast());

    act(() => {
      result1.current.toast({ title: "Shared Toast" });
    });

    // Both hooks should see the same toast
    expect(result1.current.toasts.length).toBe(result2.current.toasts.length);
  });

  it("cleans up listener on unmount", () => {
    const { unmount, result } = renderHook(() => useToast());

    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
  });
});
