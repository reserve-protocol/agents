# MEV Opportunities

The Reserve Protocol creates MEV opportunities primarily through issuance/redemption arbitrage and Dutch auction bidding.

## Issuance and Redemption Arbitrage

MEV searchers can arb the RToken's issuance/redemption price against market prices on AMMs or CEXs. This works as expected:

- **Issuance**: Call `issue()` on the RToken contract to mint new tokens by depositing collateral. Requires prior ERC20 approvals.
- **Redemption**: Call `redeem()` to burn RTokens and receive backing collateral. No approvals needed.

The challenge is predicting exact token quantities, since underlying exchange rates move between transaction construction and execution:
- For issuance, rates move in favor of the issuer (fewer tokens required than quoted).
- For redemption, rates move against the redeemer (fewer tokens received than quoted).

### Getting Quotes

Use static calls against the Facade contract to get tight quotes:

```solidity
// Get issuance quote
function issue(address rToken, uint256 amount)
  external returns (
    address[] memory tokens,
    uint256[] memory deposits,
    uint192[] memory depositsUoA
  );

// Get redemption quote
function redeem(address rToken, uint256 amount)
  external returns (
    address[] memory tokens,
    uint256[] memory withdrawals,
    uint256[] memory available
  );
```

These simulate refreshing all underlying collateral in the current block. They do not require token balances or approvals. Do not execute these on-chain (high gas cost) — use static calls only.

Facade addresses:
- Ethereum: 0x2C7ca56342177343A2954C250702Fd464f4d0613
- Base: 0xEb2071e9B542555E90E6e4E1F83fa17423583991
- Arbitrum: 0x387A0C36681A22F728ab54426356F4CAa6bB48a9

## Dutch Auction Bidding (Yield DTFs)

Monitor Broker contracts for `TradeStarted` events. Check `trade.KIND()`:
- KIND == 0: DutchTrade (falling-price dutch auction)
- KIND == 1: GnosisTrade (batch auction)

### DutchTrade

To participate in a Dutch auction:

1. Call `status()` — auction is active if return value is 1.
2. Call `lot()` to see the sell token quantity.
3. Call `bidAmount(timestamp)` to see the buy token cost at various timestamps.
4. Set a tight approval for the `buy()` token. Set approval to exactly `bidAmount()` for the target block — reorgs present risk with loose approvals.
5. Wait for the desired block (ideally not in the first 40% of the auction — geometric phase).
6. Call `bid()` or `bidWithCallback(bytes)`.

The `bidWithCallback` method enables flash-loan-like patterns: your contract receives the sell tokens first, then must transfer the buy tokens in the callback via the `IDutchTradeCallee` interface.

If someone else bids first, `bid()` reverts with "bid already received."

### Price Curve

Dutch auctions have a distinctive two-phase price curve:

1. **Geometric phase (first 40%)**: Price starts at ~1000x the best plausible price and drops ~10.87% per block (at 12s blocks, 30min auction). Defensive phase — bids here trigger trade violation detection.
2. **Linear phase (last 60%)**: Price decreases linearly from best plausible to worst plausible price (accounting for oracle errors and maxTradeSlippage).

The best plausible price = sell token high price / buy token low price. The worst = sell token low price / buy token high price, minus maxTradeSlippage.

### Trade Violation Fallback

If a Dutch auction clears in the geometric phase (first 40%), Dutch auctions become disabled for that trading pair. The rationale: a trade clearing at multiples above the plausible price suggests price manipulation. Subsequent trades for that pair must use batch auctions. Re-enabling requires governance action.

### Batch Auctions (GnosisTrade)

Batch auctions via Gnosis EasyAuction are the fallback mechanism. Bidders place orders during a window, and a next-price clearing mechanism determines the outcome. Non-atomic and more expensive, but no price assumptions needed. Atomic settlement is disabled, making the MEV opportunity less attractive.

## Index DTF Auctions

Index DTF rebalancing uses a different auction system. Anyone can bid in an active Folio auction:

```solidity
function getBid(
  uint256 auctionId,
  IERC20 sellToken,
  IERC20 buyToken,
  uint256 timestamp,
  uint256 maxSellAmount
) external view returns (uint256 sellAmount, uint256 bidAmount, uint256 price);
```

The auction price decays exponentially between the start and end prices set by the governance-approved range. Bid up to the `sellAmount` size as long as the `price` exchange rate is met.
