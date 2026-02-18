# Rebalancing

Rebalancing is the process by which DTFs adjust their basket composition through onchain auctions. The mechanisms differ between Yield DTFs and Index DTFs.

## Yield DTF Rebalancing (Recollateralization)

When a Yield DTF's basket needs to change — due to collateral default or governance action — the BackingManager executes a trading algorithm to sell surplus assets and buy deficit assets.

### The BU Price Band

The protocol maintains a "basket range" — a two-sided estimate in basket units (BU) of how many basket units the protocol expects to hold after trading completes:

- **basketRange.top** (optimistic): Assumes starting from maximum current holdings, trading at best prices with zero slippage, and no value lost to dust.
- **basketRange.bottom** (pessimistic): Assumes starting from minimum current holdings, trading at worst prices with full maxTradeSlippage, and losing minTradeVolume per asset to dust.

The spread between top and bottom represents uncertainty from oracle errors, slippage, and dust. This spread should narrow with each completed trade.

### Trade Selection

The algorithm selects the next trade using these priorities (in order):

1. Trade must exceed `minTradeVolume`.
2. Trade must not exceed `maxTradeVolume`.
3. **Sell DISABLED collateral first**, then SOUND, then IFFY last (IFFY may recover).
4. **No double-trading** of SOUND assets: capital traded from A to B should not later be traded to C.
5. **Largest trades first** (by UoA value).

Token surplus is measured relative to `basketRange.top`; token deficit is measured relative to `basketRange.bottom`. This asymmetry is intentional — it avoids selling assets that might be needed (optimistic view for surplus) while being conservative about what to buy (pessimistic view for deficit).

### Trade Sizing

Two sizing methods:

- **`prepareTradeToCoverDeficit`** (primary): Takes the buy amount as target and calculates a sufficient sell amount. May over-buy due to pessimistic price assumptions.
- **`prepareTradeSell`** (secondary): Takes the sell amount as target. Used only for unpriced or IFFY/DISABLED collateral. For unpriced assets, sells the entire balance.

### Haircut

If the protocol runs out of tradeable assets and is still undercollateralized, it takes a "haircut" — reducing `RToken.basketsNeeded` to match current holdings. This is a loss for RToken holders but restores the system to a collateralized state so it can resume normal operation.

### Trade Types

The BackingManager tries Dutch auctions first (atomic, cheaper). If a Dutch auction clears in the geometric phase (indicating possible price manipulation), Dutch auctions are disabled for that pair and the system falls back to Gnosis batch auctions.

## Index DTF Rebalancing

Index DTFs rebalance through a governance-controlled process with a different mechanism than Yield DTFs.

### Lifecycle

1. **Start Rebalance**: The REBALANCE_MANAGER provides ranges for all parameters:
   - **RebalanceLimits**: `low` (buy up to), `spot` (fallback estimate), `high` (sell down to) — in basket units per share.
   - **WeightRange** per token: `low`, `spot`, `high` — the token's weight in the basket unit.
   - **PriceRange** per token: `low`, `high` — price bounds in UoA per token.

2. **Auction Launcher Window**: After a rebalance starts, only the AUCTION_LAUNCHER can open auctions during a restricted period. This ensures the trusted operator acts first. Their window extends if they're actively using it. After the restricted period (always >= 120s buffer), anyone can open auctions permissionlessly.

3. **Open Auction**: The launcher (or permissionless caller) opens an auction. The launcher can optionally narrow the approved ranges for better execution. Permissionless callers use the spot estimates without modification.

4. **Bidding**: During the auction, anyone can bid on any token pair. The auction price decays exponentially from `startPrice` to `endPrice`. Bidders pay the current price for up to `sellAmount` of the sell token.

5. **Convergence**: With each auction, the AUCTION_LAUNCHER progressively narrows the rebalance limits until `low == spot == high` for all variables. At that point, the rebalance is complete.

### Price Curve

The auction price follows an exponential decay between two extremes:
- **startPrice**: Most optimistic — derived from sell token's high price and buy token's low price.
- **endPrice**: Most pessimistic — derived from sell token's low price and buy token's high price.

The price decays from startPrice to endPrice over the auction duration. Bidders wait for an attractive price and call `bid()`.

### Lot Sizing

Surplus is measured relative to `RebalanceLimits.high * weight` (the point to sell down to). Deficit is measured relative to `RebalanceLimits.low * weight` (the point to buy up to). The `sellAmount` is the largest quantity that can be transacted without violating either token's limits.

The sell amount may increase or decrease over successive auctions:
- If sell token surplus is the limiting factor, sell amounts increase as limits narrow.
- If buy token deficit is the limiting factor, sell amounts decrease.

### TTL and Safety

Rebalances have a time-to-live (TTL). Any number of auctions can run within this window. The AUCTION_LAUNCHER can extend the TTL if needed.

If asset prices move outside the approved range, the AUCTION_LAUNCHER should end the rebalance to prevent value leakage. With PARTIAL or ATOMIC_SWAP price control, the launcher has additional ability (and responsibility) to manage execution quality.
