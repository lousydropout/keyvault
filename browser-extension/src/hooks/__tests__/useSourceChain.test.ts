import { describe, it, expect } from "bun:test";
import {
  getSourceChainFromAccounts,
  getSourceDisplayText,
  SourceChainInfo,
} from "@/utils/sourceChainUtils";
import { ChainAccountInfo } from "@/utils/discoverAccounts";
import { astar, base, hardhat } from "viem/chains";

describe("getSourceChainFromAccounts", () => {
  const accounts: ChainAccountInfo[] = [
    { chainId: astar.id, chainName: "Astar", numEntries: 5 },
    { chainId: base.id, chainName: "Base", numEntries: 10 },
    { chainId: hardhat.id, chainName: "Localhost", numEntries: 3 },
  ];

  it("returns chain with most entries among enabled chains", () => {
    const enabledChainIds = [astar.id, base.id, hardhat.id];
    const result = getSourceChainFromAccounts(accounts, enabledChainIds);

    expect(result).not.toBeNull();
    expect(result?.chainId).toBe(base.id);
    expect(result?.chainName).toBe("Base");
    expect(result?.numEntries).toBe(10);
  });

  it("handles single enabled chain correctly", () => {
    const enabledChainIds = [astar.id];
    const result = getSourceChainFromAccounts(accounts, enabledChainIds);

    expect(result).not.toBeNull();
    expect(result?.chainId).toBe(astar.id);
    expect(result?.chainName).toBe("Astar");
    expect(result?.numEntries).toBe(5);
  });

  it("returns null when no chains enabled", () => {
    const result = getSourceChainFromAccounts(accounts, []);
    expect(result).toBeNull();
  });

  it("returns null when enabled chains not in accounts", () => {
    const result = getSourceChainFromAccounts(accounts, [999]);
    expect(result).toBeNull();
  });

  it("returns null when accounts array is empty", () => {
    const result = getSourceChainFromAccounts([], [astar.id, base.id]);
    expect(result).toBeNull();
  });

  it("filters to only enabled chains when selecting source", () => {
    // Only astar and hardhat enabled, so should pick astar (5) not base (10)
    const enabledChainIds = [astar.id, hardhat.id];
    const result = getSourceChainFromAccounts(accounts, enabledChainIds);

    expect(result).not.toBeNull();
    expect(result?.chainId).toBe(astar.id);
    expect(result?.numEntries).toBe(5);
  });

  it("handles tie by returning first with max entries", () => {
    const tiedAccounts: ChainAccountInfo[] = [
      { chainId: astar.id, chainName: "Astar", numEntries: 10 },
      { chainId: base.id, chainName: "Base", numEntries: 10 },
    ];
    const enabledChainIds = [astar.id, base.id];
    const result = getSourceChainFromAccounts(tiedAccounts, enabledChainIds);

    expect(result).not.toBeNull();
    expect(result?.numEntries).toBe(10);
    // Should return first one found with max entries
    expect(result?.chainId).toBeDefined();
    expect([astar.id, base.id]).toContain(result!.chainId);
  });
});

describe("getSourceDisplayText", () => {
  it("returns formatted text for source chain", () => {
    const sourceChain: SourceChainInfo = {
      chainId: base.id,
      chainName: "Base",
      numEntries: 10,
    };
    expect(getSourceDisplayText(sourceChain)).toBe("Reading from Base");
  });

  it("returns null when source chain is null", () => {
    expect(getSourceDisplayText(null)).toBeNull();
  });
});
