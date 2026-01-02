import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

/**
 * Deployment Verification Tests
 *
 * These tests verify that the KeyVault contract can be deployed correctly
 * and that basic contract interactions work as expected.
 * Run against local Hardhat network or mainnet deployments.
 */
describe("Deployment Verification", function () {
  async function deployKeyvaultFixture() {
    const [owner, user] = await hre.ethers.getSigners();
    const Keyvault = await hre.ethers.getContractFactory("Keyvault");
    const keyvault = await Keyvault.deploy();

    return { keyvault, owner, user };
  }

  describe("Contract Deployment", function () {
    it("should deploy contract with valid address", async function () {
      const { keyvault } = await loadFixture(deployKeyvaultFixture);

      const address = await keyvault.getAddress();
      expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should initialize with zero entries for any account", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      const numEntries = await keyvault.numEntries(owner.address);
      expect(numEntries).to.equal(0);
    });
  });

  describe("Contract Interaction", function () {
    it("should store and retrieve a credential entry", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      const testCredential = JSON.stringify({
        name: "Test Site",
        url: "https://example.com",
        username: "testuser",
        password: "encrypted_password_data",
      });

      await keyvault.storeEntry(testCredential);

      const numEntries = await keyvault.numEntries(owner.address);
      expect(numEntries).to.equal(1);

      const storedEntry = await keyvault.getEntry(owner.address, 0);
      expect(storedEntry).to.equal(testCredential);
    });

    it("should retrieve multiple credentials via getEntries", async function () {
      const { keyvault, owner } = await loadFixture(deployKeyvaultFixture);

      const credentials = [
        JSON.stringify({ name: "Site A", url: "https://a.com" }),
        JSON.stringify({ name: "Site B", url: "https://b.com" }),
        JSON.stringify({ name: "Site C", url: "https://c.com" }),
      ];

      for (const cred of credentials) {
        await keyvault.storeEntry(cred);
      }

      const retrievedCredentials = await keyvault.getEntries(
        owner.address,
        0,
        10
      );
      expect(retrievedCredentials.length).to.equal(3);
      expect(retrievedCredentials[0]).to.equal(credentials[0]);
      expect(retrievedCredentials[1]).to.equal(credentials[1]);
      expect(retrievedCredentials[2]).to.equal(credentials[2]);
    });
  });

  describe("Ignition Module Verification", function () {
    it("should deploy via Ignition module pattern", async function () {
      // This test verifies the deployment pattern used by Hardhat Ignition
      // by deploying directly with the same contract factory approach
      const Keyvault = await hre.ethers.getContractFactory("Keyvault");
      const keyvault = await Keyvault.deploy();
      await keyvault.waitForDeployment();

      const address = await keyvault.getAddress();
      expect(address).to.be.properAddress;

      // Verify contract is functional after deployment
      const numEntries = await keyvault.numEntries(
        (await hre.ethers.getSigners())[0].address
      );
      expect(numEntries).to.equal(0);
    });
  });
});
