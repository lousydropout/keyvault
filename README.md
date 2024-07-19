# Keyvault

A blockchain-based password manager.

## deployments

- Astar: https://astar.blockscout.com/address/0xC273ea964b5C975Fdbba9DF9624649F1038aAf9B

## Purpose of Keyvault

The primary purpose of the Keyvault smart contract is to offer a blockchain-based solution for securely storing, managing, and accessing encrypted data entries. In the era of digital information, where data breaches and unauthorized access are of significant concern, Keyvault provides a decentralized alternative that leverages blockchain technology's inherent security features, such as transparency, immutability, and resistance to tampering. This smart contract is designed to store encrypted entries that contain sensitive information in a structured JSON format, allowing users to maintain control over their data while benefiting from the blockchain's security properties.

## Keyvault's Approach to Data Security

Keyvault employs an append-only data structure (see below for more detail) to manage credentials and other sensitive information. This approach, chosen to mitigate potential race conditions and ensure data consistency across multiple access points, is particularly effective in scenarios where users might interact with their data from various devices without regular synchronization.

For example, if we structure the data as JSON objects and enforce the use of AES-GCM for encryption, then Keyvault enables users to store their data securely on-chain, with each entry comprising an initialization vector (IV) and ciphertext to ensure confidentiality and data integrity.

## Data Structure

Keyvault is optimized for storing credentials and related information in a structured, append-only format. This approach mitigates potential race conditions and ensures consistency across multiple devices. The data entries are structured as JSON objects, encrypted before being sent to the blockchain.

## Credential Storage

For storing new credentials or updating existing ones, the JSON structure is as follows:

```json
{
  "url": "<url>",
  "username": "<username>",
  "password": "<password>",
  "description": "<description>",
  "idx": "<previous version's index>",
  "timestamp": "<when this cred was last updated>"
}
```

- `idx = -1` indicates a new credential entry.
- `idx != -1` indicates that this entry is an updated version of the credential at the specified index.

### Credential Deletion

To mark a credential as deleted, the structure is:

```json
{
  "deleted": true,
  "idx": "<deleted version's index>",
  "timestamp": "<when this cred was decided to be deleted>"
}
```

This append-only model ensures immutability and traceability of credential changes over time.

## Encryption

The Keyvault smart contract is encryption algorithm agnostic. However, the smart contract is intended to be used as part of a blockchain-based password manager, also to be known as Keyvault. As is required for a smart contract on a public blockchain, encryption and decryption take place on the frontend. Whether or not this smart contract provides a secure environment to store secrets and credentials will therefore depend on the choices made on the frontend.

For our blockchain-based password manager, we intend to use AES-GCM.

### Why AES-GCM?

- **Security**: AES-GCM offers strong encryption and authentication, making it suitable for protecting sensitive information.
- **Performance**: It is efficient for both encryption and decryption processes, important for user experience.
- **IV Requirement**: AES-GCM requires an Initialization Vector (IV) for each encryption operation, ensuring that encryption of the same data results in different ciphertexts, enhancing security.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](https://github.com/lousydropout/keyvault/blob/main/LICENSE) file for details.

## Acknowledgements

This project has recently been accepted as part of Astar's Unstoppable Community Grant program, see [UCG Overview](https://docs.google.com/presentation/d/1HH8651zROJjE3cXFCGCsP3-dXwMR2TvoclYT0WkuF5E/edit#slide=id.g24e462a4831_0_0) for more details.
As such, this project is now being financially supported by the Astar Community. Thank you!

An early version of this project was submitted to the Polkadot ink! Hackathon in Oct/Nov 2023, hosted within my [password-manager repository](https://github.com/lousydropout/password-manager/tree/encode.club-hackathon-submission).

I was fortunate to secure 3rd place in the main track, **Most Innovative ink! dApp**, and also received an honorable mention for being one of the **best projects using ink!athon or AZERO.ID**.

Tina Bregović has provided an insightful write-up of the event, which is available on Medium under the title [Polkadot ink! Hackathon powered by Encode Club—Prizewinners and Summary](https://www.blog.encode.club/polkadot-ink-hackathon-powered-by-encode-club-prizewinners-and-summary-0ee9efac42ea#a067).

While the project did not place in the **Astar Bounty** track, which offered winners "exclusive access to a mentor programme with Astar," I received invaluable encouragement from Astar's **Sofiya Vasylyeva**. Her words of encouragement and periodic check-ins on my progress have significantly contributed to the continued development of this project. Without her support, the journey to this point would have been much longer and more challenging.
