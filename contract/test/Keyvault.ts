import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Keyvault", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployKeyvaultFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Keyvault = await hre.ethers.getContractFactory("Keyvault");
    const keyvault = await Keyvault.deploy();

    return { keyvault, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should store and retrieve an entry", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      const entry = "my secret entry";
      await keyvault.storeEntry(entry);

      expect(await keyvault.getEntry(owner.address, 0)).to.equal(entry);
    });

    it("Should store and retrieve multiple entries", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      const entries = ["entry1", "entry2", "entry3"];
      for (const entry of entries) {
        await keyvault.storeEntry(entry);
      }

      const retrievedEntries = await keyvault.getEntries(owner.address, 0, 3);
      expect(retrievedEntries).to.deep.equal(entries);
    });

    it("Should store and retrieve a public key", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      const pubkey = "my public key";
      await keyvault.storePubkey(pubkey);

      expect(await keyvault.pubKey(owner.address)).to.equal(pubkey);
    });
  });
});
