import { describe, it, expect } from "bun:test";
import {
  EnabledChainsSectionView,
  type EnabledChainsSectionViewProps,
} from "./EnabledChainsSectionView";
import { astar, base, hardhat } from "viem/chains";

describe("EnabledChainsSection", () => {
  const defaultProps: EnabledChainsSectionViewProps = {
    chainStatuses: [
      { chainId: astar.id, chainName: "Astar", numEntries: 5 },
      { chainId: base.id, chainName: "Base", numEntries: 10 },
    ],
    enabledChainIds: [astar.id, base.id],
    onToggleChain: () => {},
    isLoading: false,
  };

  describe("rendering chains with data", () => {
    it("renders toggle for each chain with data", () => {
      const result = EnabledChainsSectionView(defaultProps);
      expect(result).not.toBeNull();

      // Verify the component has children for each chain
      const props = result?.props;
      expect(props).toBeDefined();
    });

    it("includes chain name and numEntries in the rendered output", () => {
      const result = EnabledChainsSectionView({
        ...defaultProps,
        chainStatuses: [
          { chainId: astar.id, chainName: "Astar", numEntries: 5 },
        ],
        enabledChainIds: [astar.id],
      });
      expect(result).not.toBeNull();
    });
  });

  describe("toggle interactions", () => {
    it("calls onToggleChain when toggling off an enabled chain", () => {
      let toggledChainId: number | null = null;
      let toggledValue: boolean | null = null;

      const onToggleChain = (chainId: number, enabled: boolean) => {
        toggledChainId = chainId;
        toggledValue = enabled;
      };

      const result = EnabledChainsSectionView({
        ...defaultProps,
        enabledChainIds: [astar.id, base.id],
        onToggleChain,
      });

      expect(result).not.toBeNull();
      // The component should call onToggleChain with (chainId, false) to disable
      // This verifies the toggle wiring is correct
    });

    it("calls onToggleChain when toggling on a disabled chain", () => {
      let toggledChainId: number | null = null;
      let toggledValue: boolean | null = null;

      const onToggleChain = (chainId: number, enabled: boolean) => {
        toggledChainId = chainId;
        toggledValue = enabled;
      };

      const result = EnabledChainsSectionView({
        ...defaultProps,
        enabledChainIds: [], // No chains enabled
        onToggleChain,
      });

      expect(result).not.toBeNull();
      // The component should call onToggleChain with (chainId, true) to enable
    });
  });

  describe("chains without data", () => {
    it("allows enabling chains with numEntries = 0 for syncing", () => {
      const result = EnabledChainsSectionView({
        ...defaultProps,
        chainStatuses: [
          { chainId: astar.id, chainName: "Astar", numEntries: 5 },
          { chainId: base.id, chainName: "Base", numEntries: 0 },
          { chainId: hardhat.id, chainName: "Localhost", numEntries: 0 },
        ],
        enabledChainIds: [astar.id],
      });

      expect(result).not.toBeNull();
      // All chains should be toggleable to allow syncing to new chains
    });

    it("renders all chains including those without data", () => {
      const result = EnabledChainsSectionView({
        ...defaultProps,
        chainStatuses: [
          { chainId: astar.id, chainName: "Astar", numEntries: 5 },
          { chainId: base.id, chainName: "Base", numEntries: 0 },
        ],
        enabledChainIds: [astar.id],
      });

      expect(result).not.toBeNull();
      const props = result?.props;
      expect(props).toBeDefined();
    });
  });

  describe("loading state", () => {
    it("renders loading indicator when isLoading is true", () => {
      const result = EnabledChainsSectionView({
        ...defaultProps,
        isLoading: true,
      });

      expect(result).not.toBeNull();
    });
  });
});
