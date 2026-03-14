# 🎮 rediit core game: Stellar 2D Game Architecture & Token System

<div align="center">

![CI](https://github.com/soft-plug/soft-plug-core/workflows/CI/badge.svg)
![Security](https://github.com/soft-plug/soft-plug-core/workflows/Security%20Scan/badge.svg)
![Coverage](https://codecov.io/gh/soft-plug/soft-plug-core/branch/main/graph/badge.svg)

![Stellar](https://img.shields.io/badge/Stellar-Soroban-7D00FF?style=for-the-badge&logo=stellar)
![Rust](https://img.shields.io/badge/Rust-2021-000000?style=for-the-badge&logo=rust)
![Axum](https://img.shields.io/badge/Axum-0.7-black?style=for-the-badge&logo=rust)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A high-performance Rust 2D game architecture featuring custom tokenized assets on the Stellar network.**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Scaffolding](#-project-scaffolding) • [Technical Deep Dive](#-technical-deep-dive) • [Security](#-security--trust) • [Ecosystem Mission](#-ecosystem-mission) • [Roadmap](#-roadmap) • [FAQ](#-frequently-asked-questions)

</div>

---

## 📖 Overview

**rediit core game** is a revolutionary 2D game project designed with a dual-layer architecture built entirely in Rust. It utilizes **Soroban Smart Contracts** on the Stellar blockchain for secure, low-cost asset ownership (NFTs, in-game tokens, marketplace deployments) combined with an off-chain **Rust API Server** using `axum`/`tokio` for handling rapid, real-time 2D game loops.

By abstracting away the complexities of smart contract development, rediit core game provides a simple, low-cost way to create digital assets, mint initial supplies, and manage token metadata while actively running a high-speed multiplayer 2D game environment.

### 🌍 Ecosystem Mission: Driving Traffic to Web3 & Stellar
A primary directive of **rediit core game** is to act as a funnel for onboarding entirely new participants into the Web3 and Stellar ecosystems. While Stellar is renowned for its speed and efficient cross-border payments, the **gaming sector** provides a massive untapped demographic that can exponentially increase the network's daily active use cases, specifically for decentralized exchanges (DEXs) and micro-transactions. By combining engaging 2D gameplay with frictionless, zero-code token deployment, rediit core game aims to:
1. **Onboard Non-Crypto Natives**: Players can earn, trade, and deploy assets with minimal crypto knowledge. The UI handles the Stellar network complexities behind the scenes.
2. **Demonstrate Network Speed & Cost**: Showcase Stellar's incredibly fast ~5-second ledger drops and fraction-of-a-cent fees (~0.00001 XLM) to a massive audience of gamers who are typically frustrated by the high gas fees of other blockchains.
3. **Empower Emerging Markets**: Specifically target creators, entrepreneurs, and gamers in regions like Nigeria, enabling them to monetize their game assets and communities without prohibitive entry costs.

---

## ✨ System Features

### 🏭 Token Factory (Soroban Smart Contracts)
*The decentralized settlement and asset layer (`contracts/`)*
- ✅ **Game Asset Minting**: Deploy custom game tokens and NFT collections with parameters like Name, Symbol, Decimals, and Initial Supply directly to the Stellar network.
- ✅ **Low Fees & Treasury**: Leverage Stellar's ultra-low transaction costs while funnelling a fractional deployment fee to the platform treasury, creating a sustainable economy.
- ✅ **Player Ownership**: Automatic minting directly to the player's wallet via Freighter validation. True digital ownership of in-game items.
- ✅ **On-Chain Metadata**: Optional IPFS metadata support for 2D sprites, item descriptions, and weapon stats, securely pinned to Stellar assets.
- ✅ **Admin Controls**: Robust controls for game masters to dictate post-deployment minting, clawbacks (if configured), and economy burn mechanics.

### ⚡ Game Server (Axum API)
*The fast execution layer (`server/`)*
- ✅ **Real-Time State Synchronization**: Multi-threaded game loop processing handling thousands of concurrent connections and physics updates without clogging the blockchain.
- ✅ **Stateless API Routes**: Standard endpoints (like `/health`) for initializing front-end client syncing and fetching server status.
- ✅ **Blockchain Bridge Engine**: Asynchronous verification of player wallets before granting access to token-gated lobbies. Validates Stellar transactions off-chain to keep gameplay buttery smooth.
- ✅ **High Concurrency**: Built on Tokio, the server easily handles thousands of lightweight asynchronous tasks for entity tracking and match-making.

---

## 🏗️ Architecture Stack

The platform is explicitly split into on-chain security and off-chain speed, defining clear execution boundaries to keep costs practically zero while maintaining a modern 60FPS game feel.

```text
┌─────────────────────────────────────────────────────────────┐
│                 Client (2D Game Renderer)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Wallet Conx  │  │ Game Engine  │  │  UI/Inventory │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
          │ (Blockchain)                      │ (HTTP/WebSockets)
          ▼                                   ▼
┌───────────────────┐               ┌───────────────────┐
│  Stellar Network  │               │ Rust Game Server  │
│    (Soroban)      │               │     (Axum)        │
│                   │◄─────────────►│                   │
│ - Asset Ownership │    Verify     │ - Game Logic      │
│ - Token Deployer  │    Wallets    │ - Physics Sync    │
│ - Minting/Fees    │               │ - Matchmaking     │
│ - Trade Execution │               │ - Anti-Cheat      │
└───────────────────┘               └───────────────────┘
```

| Layer              | Technology                 | Explicit Purpose                               |
|--------------------|----------------------------|------------------------------------------------|
| **Smart Contract** | Rust (Soroban SDK)         | Cryptographic asset verification, trading, minting (`contracts/core_game/`) |
| **Backend API**    | Rust (Axum, Tokio, Serde)  | Off-chain heavy logic engine, real-time loops (`server/`)       |

---

## 🛠 Technical Deep Dive

### Soroban Smart Contract Architecture
The on-chain component focuses on **State Integrity** and **Asset Security**. 
- **Storage Strategy**: We utilize Soroban's `persistent` storage for player profiles and `temporary` storage for high-frequency but non-critical game session metadata to optimize ledger costs.
- **WASM Optimization**: Using the `soroban-sdk`, we've optimized the binary for minimum footprint, ensuring that complex game logic doesn't hit the execution limit of the Stellar network.
- **Events Layer**: Every critical transaction (minting, transfers, registration) emits a standard Soroban Event, allowing our off-chain server to index game state in real-time.

### High-Speed Game Server (Rust/Axum)
The off-chain engine is designed for **Vertical Scalability**.
- **Lock-free Concurrency**: Where possible, we use atomic operations and thread-local storage to minimize contention in the game loop.
- **Stellar Horizon Integration**: The server maintains a sidecar service that polls the Horizon API to confirm on-chain settlements before updating in-game balances.
- **Serialization**: Using `serde` with `MessagePack` (planned) for ultra-compact state transmission between the server and the 2D client.

---

---

## 📁 Project Scaffolding

The repository is built as a **Cargo Workspace**, managing two entirely distinct architectural domains (Blockchain vs Game Loop) seamlessly from the project root.

```text
soft-plug-core/
├── Cargo.toml                   # Workspace Root Config (profiles, optimization)
│
├── contracts/                   # 1. On-Chain Token Factory
│   └── core_game/               # Soroban Smart Contract Core
│       ├── src/
│       │   ├── lib.rs           # Core deployment & minting logic
│       │   └── test.rs          # Contract property tests & Soroban integration
│       └── Cargo.toml           # no_std dependencies (soroban-sdk)
│
├── server/                      # 2. Off-Chain Game Engine
│   ├── src/
│   │   └── main.rs              # Axum/Tokio high-speed API server entrypoint
│   └── Cargo.toml               # server dependencies (axum, tokio, serde)
│
└── README.md
```

---

## 🚀 Quick Start Environment

### Prerequisites
Before you begin, ensure you have the following installed to run the full stack:
- **Node.js** 18+ (For future front-end client rendering)
- **Rust** 1.70+ ([Install via Rustup](https://rustup.rs/))
- **Soroban CLI** ([Installation Guide for Stellar](https://soroban.stellar.org/docs/getting-started/setup))
- **Freighter Wallet** browser extension (to interact with generated assets)

### Local Installation & Testing

The project is structured using a unified **Cargo Workspace**. This manages the dependencies for both the blockchain contracts and the off-chain game server simultaneously from the root `Cargo.toml`.

1. **Clone the Repository & Setup:**
```bash
git clone https://github.com/soft-plug/soft-plug-core
cd soft-plug-core
```

2. **Smart Contract Compilation (Soroban Token Factory):**
   *Note: Soroban smart contracts must be compiled to WebAssembly (WASM) to run on the Stellar network.*
```bash
cd contracts/core_game

# Run local Rust unit tests and property testing
cargo test

# Build WASM optimized for the Stellar Network
cargo build --target wasm32-unknown-unknown --release

# Optimize the payload size via the Soroban CLI
soroban contract optimize --wasm ../../target/wasm32-unknown-unknown/release/core_game.wasm
```

3. **Start the Off-Chain Game Server Engine:**
   *This server acts as the game's backbone, communicating with the WebAssembly contracts when needed.*
```bash
cd server

# Boot the API server for client connections
cargo run
```
*The server will boot and begin listening for client connections at `http://localhost:3000/health`. Check this endpoint in your browser to verify it is running.*

---

## 🗺️ Roadmap & Current State

### Phase 1: MVP Prototype (10% Codebase) ✅
- [x] **Workspace Configuration**: Initializing Cargo Workspace root to stitch together varied crate types.
- [x] **Contract Scaffolding**: Bootstrapping the `core_game` Soroban smart contract with basic init/test frameworks.
- [x] **Server Scaffolding**: Bootstrapping the high-performance Axum off-chain server for real-time operations.
- [x] **Architecture Design**: Merging the Stellar Token Deployer vision into the 2D Game Architecture blueprint.

### Phase 2: Core Gameplay & Web3 Linking (In Progress)
- [ ] Implement robust `create_token` and `mint` logic in the factory contract specifically tailored for game items.
- [ ] Connect the Axum game server to verify Soroban smart contract logs via the Stellar Horizon API.
- [ ] Build the initial front-end 2D visual layout (React/Webview).
- [ ] Implement wallet-based player authentication (Freighter) directly within the Axum server API.

### Phase 3: Advanced Features & Ecosystem Scaling
- [ ] **IPFS Integration**: Pinning 2D spritesheet metadata and dynamic item stats to on-chain tokens.
- [ ] **Batch Item Deployment**: Functionality for mass airdrops, season rewards, and tournament payouts.
- [ ] **Marketplace Integration**: Allowing players to trustlessly trade deployed assets on a native DEX interface.
- [ ] **Data Analytics**: Tracking Stellar network traffic injections generated by the game server.

---

## 🔒 Security & Trust

### Non-Custodial Design
**rediit core game** never holds your private keys. Every transaction is initiated by the client and signed via the **Freighter Wallet**. The smart contract code is immutable once deployed, ensuring that your game assets remain yours regardless of the server's state.

### Audit Readiness
Our Rust implementation follows strict security patterns:
- **Panic Safety**: Using `no_std` in contracts to prevent unexpected runtime crashes.
- **Input Validation**: Every contract function strictly validates addresses and amounts before execution.
- **Reentrancy Protection**: leveraging the inherent safety of the Soroban execution model.

---

## 🤝 Contributing

We welcome contributions from the global Stellar and Rust communities! 
1. **Fork** the repo.
2. **Create a branch** for your feature: `git checkout -b feat/ultra-fast-physics`.
3. **Commit** your changes with clear messages.
4. **Push** and open a **Pull Request**.

Please ensure all new code includes unit tests and follows the `cargo fmt` standard.

---

## ❓ Frequently Asked Questions

### Why Stellar instead of Ethereum?
Stellar provides near-instant finality (5 seconds) and fees that are practically zero (~0.00001 XLM). For a gaming environment where players may perform dozens of actions daily, this is the only viable path for mass adoption.

### Do I need XLM to play?
Yes, a tiny amount of XLM is required to cover the network fees for asset deployment and transfers. However, our server layer is being designed to potentially sponsor player transactions in the future (Fee Bump Transactions).

### Is the game server open source?
Yes, the entire stack (contracts and server) is under the MIT license. We believe in transparency for the "rediit core game" ecosystem.

### How does the server verify I own an item?
The server uses the `Stellar SDK` to query the ledger state. It cross-references your signed login session with the token balance on the Stellar network.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📞 Support & Community

- **GitHub Issues**: For bug reports and feature requests.
- **Discord/Telegram**: [Link Pending]
- **Twitter**: [@soft_plug](https://twitter.com/soft_plug)

<div align="center">
  Built with 🦀 and ✨ for the future of Web3 Gaming.
</div>
