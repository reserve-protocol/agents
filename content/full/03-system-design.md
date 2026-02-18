# System Design

This section covers the contract architecture and key design concepts of the Reserve Protocol's Yield DTF system.

## Contract Architecture

The protocol is split into **core contracts** and **plugins**.

Core contracts include Main and the Component contracts registered by Main. They share governance, pausing status, are upgradable, and form a single security domain.

Plugin contracts are individual, static contracts registered with core contracts. This includes Asset/Collateral contracts (registered in AssetRegistry) and Trade contracts (selected by the Broker). Plugins have only short-term state, are not individually pausable, and are not upgradable — to upgrade a plugin, simply replace it.

## Monetary Units

The protocol uses a precise system of monetary units to track value:

- **Unit of Account `{UoA}`**: A common measure for comparing asset values (currently USD). Used internally for decisions like "is there enough surplus to start an auction?"
- **Target Unit `{target}`**: The exogenous unit that each collateral is expected to track. For a USD stablecoin basket, each collateral targets USD. For a mixed basket, different collateral may target different units (USD, ETH, BTC).
- **Reference Unit `{ref}`**: The base unit against which collateral appreciation is measured. For compound USDC (cUSDC), the reference unit is USDC. Revenue = growth of `{tok}` against `{ref}`.
- **Token `{tok}`**: The actual ERC20 token held as collateral.

Exchange rates connect these units:
- `refPerTok()`: How many reference units one collateral token is worth (increases over time for yield-bearing collateral)
- `targetPerRef()`: How many target units one reference unit is worth (should be constant, e.g., 1 USDC = 1 USD)
- `{UoA/tok}`: The market price of a token in the unit of account

Example: For cUSDC in a USD-denominated RToken:
- `{tok}` = cUSDC
- `{ref}` = USDC
- `{target}` = USD
- `{UoA}` = USD
- `refPerTok()` = cUSDC redemption rate (increases as Compound accrues interest)
- `targetPerRef()` = 1 (1 USDC = 1 USD)

## Basket Dynamics

There are three levels of basket definition:

### Prime Basket
Set directly by governance. A set of `<collateral token, target unit, target amount>` triples. For example: "0.33 USD/BU as cUSDC, 0.33 USD/BU as aUSDT, 0.34 USD/BU as DAI." Only changes through governance action.

### Reference Basket
Derived from the prime basket when a basket switch occurs (due to default or governance action). A set of `<collateral token, reference unit, reference amount>` triples. For example: "0.33 USDC/BU as cUSDC" — meaning each basket unit contains whatever amount of cUSDC is redeemable for 0.33 USDC.

### Collateral Basket
Derived moment-by-moment from the reference basket using current exchange rates. A set of `<collateral token, token amount>` pairs. This is what issuers and redeemers interact with — the exact token quantities per basket unit.

## Token Flow

- **BackingManager**: Holds all collateral backing outstanding RTokens.
- **Furnace**: Holds revenue RToken being melted (burned) to distribute yield to holders.
- **StRSR**: Holds staked RSR and distributes RSR rewards.
- **RevenueTrader**: Holds surplus assets being traded for RSR or RToken.

## Auction Types

### Dutch Auctions (DutchTrade)
Preferred trading method. Atomic, gas-efficient, but requires a price assumption.

The auction has two phases:
1. **Geometric phase (first 40%)**: Price starts at ~1000x the best plausible price and decays exponentially. Defensive — not expected to receive bids. If a bid clears here, Dutch auctions are disabled for that trading pair (possible price manipulation).
2. **Linear phase (last 60%)**: Price decreases linearly from best plausible to worst plausible price plus maxTradeSlippage.

Default duration: 30 minutes on mainnet (12s blocks), 15 minutes on L2s. Bidders call `bid()` or `bidWithCallback()`.

### Batch Auctions (GnosisTrade)
Fallback method via Gnosis EasyAuction. Higher cost, non-atomic, but requires no price assumptions. Bidders place sealed bids during a window, then a next-price clearing mechanism determines the outcome.

## System States

- **Issuance-paused**: Only RToken.issue() is halted. Used when bad debt may be entering the system.
- **Trading-paused**: Most backing/revenue management is halted (rebalancing, revenue trading, claims). Issuance and redemption remain active. Used for price feed malfunctions or false positive defaults.
- **Frozen**: Nearly everything halted except ERC20 transfers, StRSR.stake(), settlement of existing trades, and Furnace/StRSR reward payout. Used for zero-day exploits requiring governance response.

Roles: PAUSER (can pause, tolerates false positives), SHORT_FREEZER (short freeze, auto-expires), LONG_FREEZER (long freeze, for zero-days).
