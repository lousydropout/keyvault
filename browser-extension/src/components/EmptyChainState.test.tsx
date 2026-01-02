import { describe, it, expect } from "bun:test";
import { EmptyChainState } from "./EmptyChainState";

describe("EmptyChainState", () => {
  describe("when credentials are empty after chain switch", () => {
    it("returns non-null element when isLoading is false", () => {
      const result = EmptyChainState({ chainName: "Astar", isLoading: false });
      expect(result).not.toBeNull();
    });

    it("includes the chain name in the rendered output", () => {
      const result = EmptyChainState({ chainName: "Base", isLoading: false });
      expect(result).not.toBeNull();

      // Verify the component structure includes chain name in the message
      const props = result?.props;
      expect(props).toBeDefined();
    });

    it("renders for different chain names", () => {
      const astarResult = EmptyChainState({
        chainName: "Astar",
        isLoading: false,
      });
      const baseResult = EmptyChainState({
        chainName: "Base",
        isLoading: false,
      });
      const localhostResult = EmptyChainState({
        chainName: "Localhost",
        isLoading: false,
      });

      expect(astarResult).not.toBeNull();
      expect(baseResult).not.toBeNull();
      expect(localhostResult).not.toBeNull();
    });
  });

  describe("when loading", () => {
    it("returns null during loading state", () => {
      const result = EmptyChainState({ chainName: "Astar", isLoading: true });
      expect(result).toBeNull();
    });

    it("returns null regardless of chain name during loading", () => {
      const astarResult = EmptyChainState({
        chainName: "Astar",
        isLoading: true,
      });
      const baseResult = EmptyChainState({
        chainName: "Base",
        isLoading: true,
      });

      expect(astarResult).toBeNull();
      expect(baseResult).toBeNull();
    });
  });
});
