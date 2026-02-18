# Index DTFs

Index DTFs are permissionless, onchain tokenized-asset indexes built on the Reserve Index Protocol. Each Index DTF is a Folio contract — an ERC20 token representing a portfolio of underlying ERC20 assets. The number of tokens in a basket can range from one to hundreds.

## Architecture

The Index DTF system consists of:

- **Folio**: The primary contract. Represents a portfolio of ERC20 assets and contains the Dutch auction rebalancing logic. Each Folio is deployed as a proxy.
- **FolioDeployer**: Factory contract for deploying new Folio instances.
- **FolioGovernor**: Time-based governor. Two governors are deployed per Folio — a "slow" governor (admin) and a "fast" governor (rebalance manager).
- **StakingVault**: Holds staked governance tokens and distributes multiple reward token types simultaneously. Central voting token for all governance.
- **FolioDAOFeeRegistry**: Manages the ecosystem-level fee that all Folios pay to the DAO.
- **FolioVersionRegistry**: Tracks Folio implementation versions for upgrades.

## Roles

Each Folio has three roles:

1. **DEFAULT_ADMIN_ROLE** (slow governor timelock): Can add/remove assets, set fees, configure auction length, set auction delay, and manage role assignments. Primary owner.
2. **REBALANCE_MANAGER** (fast governor timelock): Can start and end rebalances. Defines the rebalance ranges (limits, weights, prices) within which auctions operate.
3. **AUCTION_LAUNCHER** (EOA or multisig): Semi-trusted operator who opens auctions within governance-approved bounds, optionally narrowing limits, weights, or prices for better execution. If offline, auctions fall back to permissionless opening after a delay.

## Minting and Redemption

Anyone can mint Folio tokens by depositing the required basket of underlying tokens. The mint amount is calculated based on current basket weights and share-to-basket-unit ratios. Redemption burns Folio tokens and returns a pro-rata share of all underlying assets.

A mint fee (up to 5%) may apply. The DAO takes a minimum floor of 15 basis points from the mint fee.

## Fees

Index DTFs support two fee types:

- **TVL Fee**: A continuous fee on assets under management, applied through share inflation. The DAO takes a minimum floor of 15 bps annually. Maximum 10% annually.
- **Mint Fee**: A one-time fee on minting. The DAO takes a minimum floor of 15 bps of the mint value. Maximum 5%.

The universal 15 bps floor can be lowered by the DAO, and can be set lower on a per-Folio basis.

## Rebalancing

Rebalancing changes the basket composition through Dutch auctions. The lifecycle is:

1. **Start Rebalance**: The REBALANCE_MANAGER specifies ranges for all variables — token weights, basket limits (how many basket units to target), and price ranges.
2. **Open Auction**: The AUCTION_LAUNCHER (or anyone, after a delay) opens an auction within the approved ranges. The launcher can optionally narrow the ranges for better execution.
3. **Bidding**: Anyone can bid on any token pair at the current auction price. The price decays exponentially from a start price to an end price over the auction duration.
4. **Auction Expiry**: When the auction ends, a new one can be opened. The rebalance continues until ranges converge or the TTL expires.

### Price Control Modes

- **Default**: AUCTION_LAUNCHER cannot modify prices. Auctions use governance-set ranges.
- **PARTIAL**: AUCTION_LAUNCHER can select a subset of the price range per auction, enabling tighter execution but also allowing some value leakage to MEV.
- **ATOMIC_SWAP**: AUCTION_LAUNCHER can fill at fixed prices within the approved range, bypassing the auction entirely. Most trust in the launcher, but enables best execution.

### Lot Sizing

Surpluses are measured relative to `RebalanceLimits.high` (the sell-down-to target) and deficits relative to `RebalanceLimits.low` (the buy-up-to target). Each auction, the launcher can progressively narrow this range. A rebalance is complete when `low == spot == high` for all variables.

## Security

- Only ERC20-compliant tokens are supported. Tokens with callbacks (ERC777), fee-on-transfer, pausable/blocklist mechanics, or multiple entrypoints are not supported.
- Upward and downward rebasing tokens are supported but discouraged due to accounting complications.
- Read-only reentrancy is possible for consuming protocols. Use `stateChangeActive()` to check.
- All Folio mutator calls are `nonReentrant`.
- Chain block times must be 30 seconds or less.
- Folio supply should not exceed 1e36.

## Deployment

Index DTFs are deployed via the FolioDeployer contract. The deployment process creates a Folio proxy, StakingVault, and governance contracts. Deployed on Ethereum mainnet and Base, with contract addresses published in the documentation.
