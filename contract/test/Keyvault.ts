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

  describe("Edge Cases", function () {
    it("Should store entry with empty string", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("");
      expect(await keyvault.getEntry(owner.address, 0)).to.equal("");
      expect(await keyvault.numEntries(owner.address)).to.equal(1);
    });

    it("Should store entry with very long string", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      const longString = "a".repeat(10000);
      await keyvault.storeEntry(longString);
      expect(await keyvault.getEntry(owner.address, 0)).to.equal(longString);
    });

    it("Should return empty string for invalid index", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      expect(await keyvault.getEntry(owner.address, 0)).to.equal("");
      expect(await keyvault.getEntry(owner.address, 999)).to.equal("");
    });

    it("Should return empty array when startFrom >= numEntries", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("entry1");
      const result = await keyvault.getEntries(owner.address, 1, 10);
      expect(result).to.deep.equal([]);
    });

    it("Should return partial results when limit > available entries", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("entry1");
      await keyvault.storeEntry("entry2");
      const result = await keyvault.getEntries(owner.address, 0, 10);
      expect(result).to.deep.equal(["entry1", "entry2"]);
    });

    it("Should handle pagination edge case: startFrom + limit > numEntries", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("entry1");
      await keyvault.storeEntry("entry2");
      await keyvault.storeEntry("entry3");
      const result = await keyvault.getEntries(owner.address, 1, 5);
      expect(result).to.deep.equal(["entry2", "entry3"]);
    });

    it("Should store pubkey with empty string", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storePubkey("");
      expect(await keyvault.pubKey(owner.address)).to.equal("");
    });

    it("Should store pubkey with very long string", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      const longPubkey = "x".repeat(5000);
      await keyvault.storePubkey(longPubkey);
      expect(await keyvault.pubKey(owner.address)).to.equal(longPubkey);
    });
  });

  describe("resetEntries", function () {
    it("Should reset numEntries to 0", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("entry1");
      await keyvault.storeEntry("entry2");
      expect(await keyvault.numEntries(owner.address)).to.equal(2);

      await keyvault.resetEntries();
      expect(await keyvault.numEntries(owner.address)).to.equal(0);
    });

    it("Should allow storing new entries after reset", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("entry1");
      await keyvault.resetEntries();
      await keyvault.storeEntry("entry2");

      expect(await keyvault.numEntries(owner.address)).to.equal(1);
      expect(await keyvault.getEntry(owner.address, 0)).to.equal("entry2");
    });

    it("Should not affect entries from other accounts", async function () {
      const { keyvault, owner, otherAccount } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("owner entry");
      await keyvault.connect(otherAccount).storeEntry("other entry");

      await keyvault.resetEntries();

      expect(await keyvault.numEntries(owner.address)).to.equal(0);
      expect(await keyvault.numEntries(otherAccount.address)).to.equal(1);
      expect(await keyvault.getEntry(otherAccount.address, 0)).to.equal("other entry");
    });
  });

  describe("Pagination", function () {
    it("Should paginate with startFrom=0, limit=1", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("entry1");
      await keyvault.storeEntry("entry2");
      await keyvault.storeEntry("entry3");

      const result = await keyvault.getEntries(owner.address, 0, 1);
      expect(result).to.deep.equal(["entry1"]);
    });

    it("Should paginate with startFrom=1, limit=2", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("entry1");
      await keyvault.storeEntry("entry2");
      await keyvault.storeEntry("entry3");

      const result = await keyvault.getEntries(owner.address, 1, 2);
      expect(result).to.deep.equal(["entry2", "entry3"]);
    });

    it("Should return empty array when limit=0", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("entry1");
      const result = await keyvault.getEntries(owner.address, 0, 0);
      expect(result).to.deep.equal([]);
    });

    it("Should handle pagination with startFrom beyond numEntries", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("entry1");
      const result = await keyvault.getEntries(owner.address, 10, 5);
      expect(result).to.deep.equal([]);
    });

    it("Should paginate through many entries", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      // Store 20 entries
      for (let i = 0; i < 20; i++) {
        await keyvault.storeEntry(`entry${i}`);
      }

      // Get first page
      const page1 = await keyvault.getEntries(owner.address, 0, 10);
      expect(page1.length).to.equal(10);
      expect(page1[0]).to.equal("entry0");
      expect(page1[9]).to.equal("entry9");

      // Get second page
      const page2 = await keyvault.getEntries(owner.address, 10, 10);
      expect(page2.length).to.equal(10);
      expect(page2[0]).to.equal("entry10");
      expect(page2[9]).to.equal("entry19");
    });
  });

  describe("Multiple Users", function () {
    it("Should store entries independently for different accounts", async function () {
      const { keyvault, owner, otherAccount } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("owner entry");
      await keyvault.connect(otherAccount).storeEntry("other entry");

      expect(await keyvault.numEntries(owner.address)).to.equal(1);
      expect(await keyvault.numEntries(otherAccount.address)).to.equal(1);
      expect(await keyvault.getEntry(owner.address, 0)).to.equal("owner entry");
      expect(await keyvault.getEntry(otherAccount.address, 0)).to.equal("other entry");
    });

    it("Should allow multiple users to store pubkeys independently", async function () {
      const { keyvault, owner, otherAccount } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storePubkey("owner pubkey");
      await keyvault.connect(otherAccount).storePubkey("other pubkey");

      expect(await keyvault.pubKey(owner.address)).to.equal("owner pubkey");
      expect(await keyvault.pubKey(otherAccount.address)).to.equal("other pubkey");
    });

    it("Should retrieve entries for specific account only", async function () {
      const { keyvault, owner, otherAccount } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry("owner1");
      await keyvault.storeEntry("owner2");
      await keyvault.connect(otherAccount).storeEntry("other1");

      const ownerEntries = await keyvault.getEntries(owner.address, 0, 10);
      const otherEntries = await keyvault.getEntries(otherAccount.address, 0, 10);

      expect(ownerEntries).to.deep.equal(["owner1", "owner2"]);
      expect(otherEntries).to.deep.equal(["other1"]);
    });
  });

  describe("Gas Optimization", function () {
    it("Should handle single entry storage", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      const tx = await keyvault.storeEntry("single entry");
      // Transaction should be sent successfully
      expect(tx).to.not.be.null;
      expect(tx.hash).to.be.a("string");
    });

    it("Should handle multiple entries storage", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      const entries = ["entry1", "entry2", "entry3"];
      for (const entry of entries) {
        await keyvault.storeEntry(entry);
      }

      const result = await keyvault.getEntries(owner.address, 0, 10);
      expect(result).to.deep.equal(entries);
    });

    it("Should handle various entry sizes", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      await keyvault.storeEntry(""); // Empty
      await keyvault.storeEntry("a"); // Single character
      await keyvault.storeEntry("a".repeat(100)); // 100 chars
      await keyvault.storeEntry("a".repeat(1000)); // 1000 chars

      expect(await keyvault.numEntries(owner.address)).to.equal(4);
      expect(await keyvault.getEntry(owner.address, 0)).to.equal("");
      expect(await keyvault.getEntry(owner.address, 1)).to.equal("a");
      expect(await keyvault.getEntry(owner.address, 2)).to.equal("a".repeat(100));
      expect(await keyvault.getEntry(owner.address, 3)).to.equal("a".repeat(1000));
    });
  });
});
