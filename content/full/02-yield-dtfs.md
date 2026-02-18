# Yield DTFs (RTokens)

Yield DTFs — also called RTokens — are self-issued tokens backed by a rebalancing basket of collateral. They are the original Reserve Protocol product, supporting yield-bearing collateral, RSR overcollateralization, and automatic revenue distribution.

## How RTokens Work

An RToken represents a basket of collateral tokens. The basket definition targets a mix of collateral types, each pegged to a "target unit" (like USD or ETH). The protocol tracks exchange rates between collateral tokens and their reference/target units to detect defaults and measure revenue.

- **Minting**: Deposit the required collateral tokens to receive new RTokens. Supply throttles limit how much can be minted per hour.
- **Redemption**: Burn RTokens to receive a pro-rata share of the backing collateral. Redemption throttles apply.
- **Arbitrage**: The mint/redeem mechanism creates natural arbitrage that keeps the RToken price aligned with the basket's net asset value.

## Core Contracts

Each Yield DTF is a system of interconnected contracts:

- **Main**: Central hub. Registers components, manages access control and governance actions.
- **AssetRegistry**: Maintains a registry of all permitted assets and collateral plugins.
- **BasketHandler**: Manages the basket definition — the set of collateral tokens and their target weights. Handles basket switching when collateral defaults.
- **BackingManager**: Holds all backing collateral. Launches rebalancing trades when the basket is undercollateralized.
- **Broker**: Dispatches trade instances (Dutch auctions or Gnosis batch auctions) to mediate trading.
- **Distributor**: Maintains the revenue split table (how much goes to RToken holders vs RSR stakers).
- **Furnace**: Melts (burns) revenue RTokens over time, distributing yield to holders by increasing the value of remaining tokens.
- **StRSR**: Manages staked RSR. Pays out RSR rewards and handles RSR seizure during recollateralization.
- **RToken**: The ERC20 token itself. Manages issuance and redemption with supply throttles.
- **RevenueTrader**: Sells revenue assets (collateral yield, reward tokens) for RSR or RToken, which then flows to StRSR or Furnace.

## Revenue Distribution

When yield-bearing collateral appreciates, the surplus above what's needed for backing becomes revenue. Revenue is split between two destinations based on a configurable ratio (default: 60% to RSR stakers, 40% to RToken holders):

- **RToken holders**: Revenue RToken flows to the Furnace, which slowly melts it. This reduces supply while backing stays constant, causing each remaining RToken to be worth more.
- **RSR stakers**: Revenue is traded for RSR and distributed through StRSR's reward mechanism with a configurable half-life.

## RSR Overcollateralization

RSR stakers provide a buffer against collateral defaults. If a collateral token defaults and the backing collateral is insufficient to maintain the basket, the protocol seizes staked RSR and sells it to buy replacement collateral. This protects RToken holders at the expense of RSR stakers.

The unstaking delay (default: 2 weeks) prevents stakers from front-running defaults by withdrawing before a known default event.

## Collateral Default Handling

Each collateral plugin monitors its underlying asset and reports a status:

- **SOUND**: The collateral is functioning normally.
- **IFFY**: Something may be wrong (e.g., price feed stale, peg deviating). The protocol treats this as temporary and waits.
- **DISABLED**: The collateral has permanently defaulted. The BasketHandler switches it out for backup collateral.

When the `refPerTok()` exchange rate decreases (meaning the collateral lost value), the plugin immediately marks itself DISABLED. This triggers the basket to switch and the BackingManager to begin rebalancing trades.

## Supply Throttles

To prevent rapid manipulation, RToken supply changes are rate-limited:

- **Issuance throttle**: Limits net minting per hour. Defined as the maximum of an absolute amount and a percentage of supply.
- **Redemption throttle**: Limits net redemption per hour. Must be set higher than the issuance throttle.

Default values: 2M RToken or 10% issuance; 2.5M RToken or 12.5% redemption (per hour).

## Deployment

Yield DTFs are deployed through a multi-phase process:

1. **Phase 1 (Common)**: Deploy core implementation contracts, libraries, Facade, Deployer, and FacadeWrite. Done once per chain.
2. **Phase 2 (Assets/Collateral)**: Deploy asset and collateral plugin contracts for the specific RToken. Reusable across RTokens.
3. **Phase 3 (RToken)**: Deploy the RToken instance via FacadeWrite, configure governance and parameters.

Deployed on Ethereum mainnet, Base, and Arbitrum.
