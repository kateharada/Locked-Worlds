# Locked Worlds

Locked Worlds is an end-to-end encrypted gaming experience that demonstrates how Zama's Fully Homomorphic Encryption (FHE) technology can power private on-chain gameplay. Players mint three mysterious keys, decrypt their attributes on demand, and spend them to claim encrypted gold rewards – all without exposing sensitive information to other players or off-chain services.

## Introduction

This project bridges advanced FHE smart contracts with a modern React interface so that every interaction, from key creation to reward redemption, respects player privacy. The contracts run on Hardhat and can be deployed to Sepolia, while the frontend uses Vite, viem, RainbowKit, and ethers to deliver a responsive, wallet-driven user journey. By combining homomorphic encryption with deterministic randomness, Locked Worlds ensures fair distribution of resources without leaking raw values on-chain.

## Core Gameplay Flow

1. **Claim Keys** – Each player may claim exactly three keys. Every key is assigned an encrypted rarity (gold, silver, or diamond) represented by the integers `1`, `2`, and `3`.
2. **Decrypt Attributes** – The frontend reveals a key's rarity only when the player chooses to decrypt it, keeping attributes shielded until that moment.
3. **Redeem Rewards** – Spending a key grants an encrypted gold payout between 100 and 1000 units, preserving the confidentiality of the reward until it is decrypted client-side.

## Advantages

- **Private Randomness**: Zama's FHE smart contracts generate and store attributes and rewards without ever exposing raw values on-chain.
- **Provable Fairness**: Deterministic randomness within the contract eliminates bias while enabling transparent auditing.
- **Wallet-Native UX**: Integrations with RainbowKit, viem, and ethers provide a frictionless experience across desktop and mobile wallets.
- **Modular Architecture**: Clear separation between contracts, deployment scripts, tests, and frontend simplifies maintenance and extensibility.

## Technology Stack

- **Smart Contracts**: Hardhat, TypeScript, and Solidity with Zama FHE libraries.
- **Encryption**: FHEVM protocol with libraries documented in `docs/zama_llm.md` and `docs/zama_doc_relayer.md`.
- **Frontend**: React + Vite application in the `frontend` directory, using viem for reads and ethers for contract writes.
- **Wallet Connectivity**: RainbowKit and wagmi for account management and network switching.
- **Tooling**: TypeScript, ESLint, Hardhat deploy, and a comprehensive test suite under `test/`.

## Project Structure

```
Locked-Worlds/
├── contracts/            # Solidity contracts (e.g., LockedWorlds.sol)
├── deploy/               # Deployment scripts configured for local and Sepolia
├── deployments/          # Network-specific ABI and deployment metadata
├── docs/                 # Internal documentation for Zama integrations
├── frontend/             # React + Vite application
├── tasks/                # Custom Hardhat tasks
├── test/                 # Automated contract tests
├── hardhat.config.ts     # Hardhat configuration with FHE settings
└── README.md             # Project overview and instructions
```

## Getting Started

### Prerequisites

- Node.js **v20+**
- npm **v9+**
- Access to an FHEVM-compatible node (local or Sepolia)
- A funded Sepolia account for deployment and interaction

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file at the project root to supply the required secrets:

```
PRIVATE_KEY=your_private_key_without_0x
INFURA_API_KEY=your_infura_project_id
ETHERSCAN_API_KEY=optional_etherscan_key
```

> The deployment scripts rely on `process.env.PRIVATE_KEY` and `process.env.INFURA_API_KEY`. Never commit the `.env` file to version control.

## Contract Workflow

1. **Compile contracts**
   ```bash
   npm run compile
   ```
2. **Run tests**
   ```bash
   npm run test
   ```
3. **Launch a local node** (FHEVM-ready)
   ```bash
   npx hardhat node
   ```
4. **Deploy locally**
   ```bash
   npx hardhat deploy --network localhost
   ```
5. **Deploy to Sepolia**
   ```bash
   npx hardhat deploy --network sepolia
   ```
6. **Verify on Etherscan (optional)**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

Deployed ABIs are stored under `deployments/<network>` and must be copied into the frontend when updating contract interactions.

## Frontend Workflow

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Connect with RainbowKit to the target network (local node or Sepolia) and interact with the dashboard to claim, decrypt, and spend keys.

The frontend strictly consumes ABIs from `deployments/<network>` and relies on viem for reads and ethers for state-changing transactions. No local storage or environment variables are used in the UI layer, ensuring deterministic behavior across environments.

## Challenges Addressed

- **Secure Asset Distribution**: Allocates items and rewards without revealing values to unauthorized parties.
- **Player Privacy**: Keeps player inventories confidential while still enabling verification through FHE proofs.
- **Network Compatibility**: Provides scripts for both local testing and Sepolia deployment without relying on mnemonic-based accounts.
- **Developer Experience**: Supplies repeatable tasks, tests, and documentation so contributors can ramp quickly.

## Future Roadmap

- **Leaderboard Encryption**: Introduce homomorphically encrypted leaderboards to compare player progress privately.
- **Mobile-Optimized UI**: Extend responsive layouts for mobile-first experiences with wallet deep links.
- **Additional Key Types**: Support seasonal or event-based key drops with configurable reward curves.
- **In-Game Marketplace**: Enable peer-to-peer trading of encrypted assets once privacy-preserving escrow is available.
- **Automated Monitoring**: Add observability tooling that tracks contract events while respecting encryption constraints.

## Documentation & References

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Solidity Guides](https://docs.zama.ai/protocol/solidity-guides)
- Project-specific notes in `docs/zama_llm.md` and `docs/zama_doc_relayer.md`

## Support

- **Issues & Feedback**: Please open GitHub issues or contact the maintainer directly.
- **Community**: Join the Zama Discord for protocol updates and integration help.
- **License**: This project is released under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for full terms.

---

Locked Worlds shows how verifiable homomorphic encryption can unlock privacy-first web3 gameplay, setting the stage for expansive, secure, and player-friendly virtual economies.
