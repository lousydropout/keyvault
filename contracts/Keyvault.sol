// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

/**
 * @title Keyvault
 * @author lousydropout
 * @notice A contract for storing encrypted secrets and public keys.
 * @custom:beta This contract and the dApp that uses this contract are currently in beta testing.
 */
contract Keyvault {
    mapping(address => uint256) public numEntries;
    mapping(address => string[]) private entries;
    mapping(address => string) public pubKey;

    /**
     * @dev Stores an entry for the message sender.
     * @param entry The entry to store.
     */
    function storeEntry(string memory entry) public {
        uint256 num = numEntries[msg.sender];
        if (num < entries[msg.sender].length) {
            entries[msg.sender][num] = entry;
        } else {
            entries[msg.sender].push(entry);
        }
        numEntries[msg.sender]++;
    }

    /**
     * @dev Retrieves an entry for a specified account and index.
     * @param account: The address of the account.
     * @param n The index of the entry.
     * @return The stored entry.
     */
    function getEntry(address account, uint256 n) public view returns (string memory) {
        if (n >= numEntries[account]) return "";
        return entries[account][n];
    }

    /**
     * @dev Retrieves multiple entries for a specified account starting from an index with a limit.
     * @param account The address of the account.
     * @param startFrom The starting index.
     * @param limit The number of entries to retrieve.
     * @return An array of stored entries.
     */
    function getEntries(address account, uint256 startFrom, uint256 limit) public view returns (string[] memory) {
        uint256 num = numEntries[account];
        if (startFrom >= num) return new string[](0);

        uint256 endIndex = startFrom + limit > num ? num : startFrom + limit;

        string[] memory result = new string[](endIndex - startFrom);
        for (uint256 i = startFrom; i < endIndex; i++) {
            result[i - startFrom] = entries[account][i];
        }

        return result;
    }

    /**
     * @dev Resets the number of entries for the message sender.
     */
    function resetEntries() public {
        numEntries[msg.sender] = 0;
    }

    /**
     * @dev Stores a public key for the message sender.
     * @param pubkey The public key to store.
     */
    function storePubkey(string memory pubkey) public {
        pubKey[msg.sender] = pubkey;
    }
}
