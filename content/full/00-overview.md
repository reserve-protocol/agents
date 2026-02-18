# Reserve Protocol

Reserve is an open, permissionless protocol for creating and managing Decentralized Token Folios (DTFs) — tokenized baskets of digital assets that anyone can mint, redeem, and trade as a single ERC20 token. The protocol is deployed on Ethereum mainnet, Base, and Arbitrum.

## What Is a DTF?

A DTF is an onchain portfolio represented by a single token. Each DTF is backed 1:1 by a basket of underlying assets. Holders can mint new DTF tokens by depositing the required basket of assets, and redeem DTF tokens to receive their pro-rata share of the underlying basket. This minting and redemption mechanism creates natural arbitrage that keeps the DTF token price closely aligned with the net asset value of its basket.

## Two Types of DTFs

### Index DTFs

Index DTFs are lightweight, diversified portfolios that can hold up to hundreds of different tokens. They are designed for broad market exposure — think of them as onchain index funds. Index DTFs are governed by a three-role system (admin, rebalance manager, and auction launcher) and rebalance through Dutch auctions. They are deployed on Ethereum and Base.

Key characteristics:
- Simple basket of ERC20 tokens, no yield mechanics
- Up to hundreds of tokens per basket
- Dutch auction rebalancing with governance-controlled parameters
- TVL fee and mint fee revenue model
- Staking vault for governance participation

### Yield DTFs

Yield DTFs (also called RTokens) are yield-bearing baskets with RSR overcollateralization. They are the original Reserve Protocol product, designed for stablecoin-like tokens and yield-bearing positions. The basket can include interest-bearing collateral (like Aave aTokens or Compound cTokens), and the protocol automatically distributes yield to token holders and RSR stakers.

Key characteristics:
- Backed by yield-bearing collateral tokens
- Overcollateralized by staked RSR (Reserve Rights)
- Automatic revenue distribution via the Furnace (to holders) and StRSR (to stakers)
- Collateral default detection and automatic basket switching
- Deployed on Ethereum, Base, and Arbitrum

## RSR (Reserve Rights)

RSR is the governance and overcollateralization token for Yield DTFs. RSR holders can stake their tokens on a specific Yield DTF to provide overcollateralization. In return, stakers earn a share of the DTF's revenue. If collateral defaults, staked RSR can be seized to recapitalize the system — this is the mechanism that makes Yield DTFs overcollateralized.

For Index DTFs, RSR is staked in a StakingVault and serves as the governance token but does not provide overcollateralization.

## Protocol Architecture

The protocol is deployed as a set of immutable implementation contracts. New DTFs are created as proxy instances through deployer contracts. Each DTF instance is independent — it has its own basket, governance, and parameters.

For Yield DTFs, the core contracts include Main (hub), AssetRegistry, BasketHandler, BackingManager, Broker (auctions), Distributor (revenue split), Furnace (RToken yield), StRSR (staked RSR), RToken (the DTF token itself), and RevenueTrader.

For Index DTFs, the architecture is simpler: a Folio contract (the DTF token with auction logic), StakingVault (governance staking), and governance contracts (FolioGovernor with timelocks).

## Key Links

- App: https://app.reserve.org
- Docs: https://docs.reserve.org
- Protocol GitHub: https://github.com/reserve-protocol/protocol
- Index DTF GitHub: https://github.com/reserve-protocol/reserve-index-dtf
