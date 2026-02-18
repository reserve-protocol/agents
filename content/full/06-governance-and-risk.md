# Governance and Risk

## Yield DTF Governance

Each Yield DTF has decentralized governance composed of its StRSR stakers. The governance system follows a standard proposal lifecycle:

1. **Snapshot delay** (default: 2 days): Voting power is snapshotted after this delay.
2. **Voting period** (default: 3 days): StRSR holders vote FOR, AGAINST, or ABSTAIN.
3. **Timelock delay** (default: 3 days): Approved proposals are queued and can be executed after this delay.

Total end-to-end: ~8 days by default.

- **Proposal threshold**: 0.01% of StRSR supply.
- **Quorum**: 10% of StRSR supply (FOR + ABSTAIN votes).
- **Guardian**: An address with cancellation power in the timelock. Can veto malicious proposals.

If StRSR balances are wiped out (all RSR seized), proposals created before that event cannot be queued or executed.

StRSR.stake() remains active during freezes so honest RSR can flow in to vote against malicious governance proposals.

## Index DTF Governance

Index DTFs use a two-governor system:

- **Slow Governor** (DEFAULT_ADMIN_ROLE): Controls high-impact parameters — adding/removing assets, setting fees, configuring roles.
- **Fast Governor** (REBALANCE_MANAGER): Controls rebalance parameters — starting rebalances, setting weight and limit ranges.

Both governors use the StakingVault as the voting token, but with different timelock delays appropriate to their scope.

## Key Governance Parameters (Yield DTFs)

### Revenue Distribution
- `dist.rTokenDist` / `dist.rsrDist`: Revenue split ratio. Default: 60% to stakers, 40% to holders.

### Trading
- `minTradeVolume`: Minimum trade size. Default: $1k mainnet, $100 L2s.
- `rTokenMaxTradeVolume`: Maximum RToken trade size. Default: $1M.
- `maxTradeSlippage`: Maximum deviation from oracle prices. Default: 1% mainnet, 0.5% L2s.
- `dutchAuctionLength`: Duration of Dutch auctions. Default: 30min mainnet, 15min L2s.
- `batchAuctionLength`: Duration of batch auctions. Default: 15min.
- `tradingDelay`: Wait time after basket change before trading. Default: 0s.

### Staking
- `unstakingDelay`: How long RSR unstaking takes. Default: 2 weeks.
- `rewardRatio`: Fraction of pending rewards paid per second. Default: 7-day half-life.
- `withdrawalLeak`: Fraction of RSR that can unstake without triggering a full refresh. Default: 5% mainnet, 1% L2s.

### Safety
- `backingBuffer`: Extra collateral held above minimum. Default: 0.15%.
- `warmupPeriod`: Delay after basket returns to SOUND before issuance/trading resumes. Default: 15min.

### Supply Throttles
- `issuanceThrottle`: Rate limit on net minting. Default: max(2M RToken, 10% of supply) per hour.
- `redemptionThrottle`: Rate limit on net redemption. Default: max(2.5M RToken, 12.5% of supply) per hour. Must exceed issuance throttle.

### Freeze/Pause
- `shortFreeze`: Duration of short freeze. Default: 3 days.
- `longFreeze`: Duration of long freeze. Default: 7 days. A long freezer has 6 charges.

## Pause and Freeze States

### Issuance-Paused
Only `RToken.issue()` is halted. Designed to stop bad debt injection when collateral default detection has a false negative. Redemption remains open.

### Trading-Paused
Broad scope — halts rebalancing, revenue trading, reward claiming, RSR unstaking/withdrawal/seizure. Issuance and redemption remain active. Used when:
- An asset's price feed malfunctions or is manipulated
- A collateral's default detection has a false positive or negative

### Frozen
Largest scope — nearly all interactions halted. Exceptions:
- **ERC20 transfers**: Always work.
- **StRSR.stake()**: Must remain active so honest RSR can vote against malicious governance proposals during a freeze.
- **StRSR.payoutRewards()** and **Furnace.melt()**: Remain active to maintain accurate exchange rates.
- **settleTrade()**: Must remain active to ensure Dutch auctions discover optimal prices (preventing exploitation if bidding were disabled mid-auction).

Freezing provides time for governance to push through a repair proposal in the event of a zero-day vulnerability.

## Risks

The protocol involves several categories of risk:

- **Smart contract risk**: Bugs in the protocol or plugin contracts could lead to loss of funds.
- **Collateral risk**: Underlying collateral tokens may default, depeg, or become illiquid.
- **Oracle risk**: Price feed failures or manipulation can cause incorrect trading or default detection.
- **Governance risk**: Malicious or negligent governance decisions can harm token holders.
- **MEV risk**: Poor auction execution or price manipulation can extract value from the protocol.
- **Bridge risk**: For L2 deployments, bridge failures could affect collateral tokens.

The protocol mitigates these through multiple mechanisms: RSR overcollateralization, pause/freeze states, supply throttles, trade violation detection, and modular governance with guardian veto power.
