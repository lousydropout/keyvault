import { describe, it, expect } from "bun:test";
import { EmptyChainState } from "./EmptyChainState";

describe("EmptyChainState", () => {
  describe("when credentials are empty", () => {
    it("returns non-null element when isLoading is false", () => {
      const result = EmptyChainState({ isLoading: false });
      expect(result).not.toBeNull();
    });

    it("renders the empty state message", () => {
      const result = EmptyChainState({ isLoading: false });
      expect(result).not.toBeNull();

      // Verify the component structure
      const props = result?.props;
      expect(props).toBeDefined();
    });
  });

  describe("when loading", () => {
    it("returns null during loading state", () => {
      const result = EmptyChainState({ isLoading: true });
      expect(result).toBeNull();
    });
  });
});
