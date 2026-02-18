# Collateral Plugins

Collateral plugins are the mechanism by which the Reserve Protocol understands and interacts with external DeFi tokens. Every ERC20 that the protocol handles must be wrapped in an Asset or Collateral contract.

## Asset vs Collateral

- **Asset**: Models any ERC20 token. Provides USD pricing, a max trade volume, and a `refresh()` function. Assets can be bought and sold but cannot back an RToken.
- **Collateral**: A subtype of Asset. Provides additional exchange rates (`refPerTok()` and `targetPerRef()`) and a `CollateralStatus`. Collateral tokens can be used as RToken backing.

## Collateral Status

Each collateral plugin maintains a status:
- **SOUND**: Normal operation. The collateral can be used as backing.
- **IFFY**: A potential problem detected (stale price feed, peg deviation). Temporary — if sustained, transitions to DISABLED.
- **DISABLED**: Permanently defaulted. The BasketHandler will swap this collateral for backup collateral.

Once DISABLED, a collateral can never return to SOUND. The IFFY duration before DISABLED is configurable per plugin.

## Exchange Rates

Collateral plugins define three exchange rates:

### `refPerTok()` — Reference per Token
How many reference units one collateral token is redeemable for. Must be non-decreasing over time. If it ever decreases, the collateral must immediately become DISABLED (fast default).

Example: For cUSDC, this is the Compound redemption rate — how many USDC you get per cUSDC. It increases as interest accrues.

### `targetPerRef()` — Target per Reference
The expected peg between the reference unit and target unit. Must be constant. If the actual market rate diverges significantly, the collateral should go IFFY and eventually DISABLED.

Example: For USDC targeting USD, this is 1.0 (1 USDC = 1 USD).

### `price()` — UoA per Token
The market price of the token in the unit of account. Returns a `[low, high]` range reflecting oracle uncertainty. The spread should not exceed ~5%.

## Writing a Collateral Plugin

### Design Questions

Before implementing, answer these questions:
1. What are the accounting units (`{tok}`, `{ref}`, `{target}`, `{UoA}`)?
2. Does the token require a wrapper (e.g., for rebasing tokens)?
3. How will the three exchange rates be computed? What oracle feeds are needed?
4. What are the trust assumptions? Can any rate be manipulated within a transaction?
5. Are there protocol-specific metrics to monitor for default?
6. How much revenue hiding is needed? (minimum 1e-6% recommended)
7. Are there claimable rewards?

### Implementation

Most plugins extend either `FiatCollateral` (for non-appreciating collateral) or `AppreciatingFiatCollateral` (for yield-bearing collateral). Developers typically only need to override three functions:

- **`tryPrice()`**: Encapsulates oracle lookups and price math. Called via try-catch to prevent `refresh()` from reverting.
- **`refPerTok()`**: Returns the reference-per-token exchange rate.
- **`targetPerRef()`**: Returns the target-per-reference exchange rate (usually `FIX_ONE`).

### Critical Properties

- **`refresh()` must never revert.** It's called at the start of many transactions. Errors should change status to DISABLED, not throw.
- **`refPerTok()` must never decrease.** Any decrease triggers immediate permanent default.
- **Defaulted collateral stays defaulted.** Once DISABLED, always DISABLED.
- **No callback tokens.** ERC777 and native ETH are not supported. Rebasing tokens must be wrapped in a non-rebasing ERC20.
- **No rebasing tokens directly.** Use a wrapper that converts rebasing to appreciation via exchange rate.
- **Token rewards must be claimable** via `claimRewards()` on the ERC20 itself.

### Revenue Hiding

Revenue hiding is used when `refPerTok()` may have small decreases (e.g., rounding in underlying protocols). A small hidden revenue buffer (default 1e-6%) absorbs minor fluctuations. The `AppreciatingFiatCollateral` base contract implements this. Revenue hiding does NOT apply to `price()` — prices should reflect true market value.

### Synthetic Reference Units

For complex positions like LP tokens, the reference unit may need to be synthetic:

- **DeFi Protocol Invariant**: For Uniswap V2 LP tokens, the reference unit is `sqrt(x * y)` where x and y are pool balances. This ensures `refPerTok()` only increases from trading fees, not from pool balance changes.
- **Revenue Hiding**: Combined with synthetic units when the underlying rate is not perfectly monotonic.

### Testing

Collateral plugin tests run on mainnet forks. The test suite imports a generic test framework and passes a fixture object. Tests verify all properties (non-reverting refresh, default detection, exchange rate behavior) against real protocol state.

### Submission

Submit plugins as PRs to the protocol repo at `contracts/plugins/assets/<protocol>/`, with tests at `test/individual-collateral/<protocol>/`.
