import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChainBanner } from "./ChainBanner";

// Mock wagmi hooks
const mockSwitchChain = vi.fn();
let mockChainId = 8453;
let mockIsPending = false;

vi.mock("wagmi", () => ({
  useChainId: () => mockChainId,
  useSwitchChain: () => ({
    switchChain: mockSwitchChain,
    isPending: mockIsPending,
  }),
}));

// Mock chainConfig
vi.mock("@/chainConfig", () => ({
  isValidChainId: (id: number) => [8453, 592, 31337].includes(id),
}));

describe("ChainBanner", () => {
  beforeEach(() => {
    mockChainId = 8453;
    mockIsPending = false;
    mockSwitchChain.mockClear();
  });

  describe("when on correct chain", () => {
    it("shows connected status", () => {
      mockChainId = 8453;

      render(<ChainBanner expectedChainId={8453} expectedChainName="Base" />);

      expect(screen.getByText("Connected to Base")).toBeInTheDocument();
    });

    it("displays green indicator", () => {
      mockChainId = 8453;

      const { container } = render(
        <ChainBanner expectedChainId={8453} expectedChainName="Base" />
      );

      const indicator = container.querySelector(".bg-green-500");
      expect(indicator).toBeInTheDocument();
    });

    it("does not show switch button", () => {
      mockChainId = 8453;

      render(<ChainBanner expectedChainId={8453} expectedChainName="Base" />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("when on wrong chain", () => {
    it("shows syncing status", () => {
      mockChainId = 31337; // localhost

      render(<ChainBanner expectedChainId={8453} expectedChainName="Base" />);

      expect(screen.getByText("Syncing to: Base")).toBeInTheDocument();
    });

    it("displays yellow indicator", () => {
      mockChainId = 31337;

      const { container } = render(
        <ChainBanner expectedChainId={8453} expectedChainName="Base" />
      );

      const indicator = container.querySelector(".bg-yellow-500");
      expect(indicator).toBeInTheDocument();
    });

    it("shows instruction to switch", () => {
      mockChainId = 31337;

      render(<ChainBanner expectedChainId={8453} expectedChainName="Base" />);

      expect(
        screen.getByText("Please switch your wallet to Base to continue.")
      ).toBeInTheDocument();
    });

    it("shows switch button for valid chain", () => {
      mockChainId = 31337;

      render(<ChainBanner expectedChainId={8453} expectedChainName="Base" />);

      expect(screen.getByRole("button")).toHaveTextContent("Switch to Base");
    });

    it("calls switchChain when button clicked", () => {
      mockChainId = 31337;

      render(<ChainBanner expectedChainId={8453} expectedChainName="Base" />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 8453 });
    });

    it("disables button when switch is pending", () => {
      mockChainId = 31337;
      mockIsPending = true;

      render(<ChainBanner expectedChainId={8453} expectedChainName="Base" />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Switching...");
    });

    it("does not show switch button for invalid chain", () => {
      mockChainId = 31337;

      render(
        <ChainBanner expectedChainId={99999} expectedChainName="Unknown Chain" />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("different chains", () => {
    it("handles Astar chain", () => {
      mockChainId = 592;

      render(<ChainBanner expectedChainId={592} expectedChainName="Astar" />);

      expect(screen.getByText("Connected to Astar")).toBeInTheDocument();
    });

    it("handles localhost chain", () => {
      mockChainId = 31337;

      render(
        <ChainBanner expectedChainId={31337} expectedChainName="Localhost" />
      );

      expect(screen.getByText("Connected to Localhost")).toBeInTheDocument();
    });
  });
});
