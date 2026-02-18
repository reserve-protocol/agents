# Reserve API

Base URL: `https://api.reserve.org`

The Reserve API provides live data about all deployed DTFs. Use it to discover DTFs, inspect basket composition, check pricing, and retrieve performance history.

## Tooling Note

The API returns JSON. Many LLM agent frameworks route web requests through HTML-to-markdown converters or AI summarizers (e.g. `web_fetch` or `browse` tools). These will:

- Lose numeric precision on prices, weights, and market caps
- Summarize or truncate large result sets
- Fail to preserve array structure for programmatic use

**Prefer `curl` + `jq`** (or any native HTTP client) when you need reliable structured data. For example:

```bash
curl -s 'https://api.reserve.org/discover/dtf?chainId=1&limit=100' | jq '.[0] | {name, symbol, address, marketCap, price}'
```

## Endpoints

### GET /discover/dtf

List all DTFs on a given chain.

**Parameters:**

| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| chainId   | number | yes      | Chain ID (see supported chains below) |
| limit     | number | no       | Max results to return. Omit for all. |

**Supported chains:**

| Chain    | chainId |
|----------|---------|
| Ethereum | 1       |
| Base     | 8453    |

**Example request:**

```bash
curl -s 'https://api.reserve.org/discover/dtf?chainId=1&limit=100'
```

**Response:** JSON array of DTF objects.

```jsonc
[
  {
    "address": "0x323c...",       // DTF contract address
    "name": "Open Stablecoin Index",
    "symbol": "OPEN",
    "chainId": 1,
    "marketCap": 162861.04,       // USD
    "price": 0.5018,              // USD per token
    "fee": 0.75,                  // Annual fee (%)
    "mandate": "Track leading decentralized stablecoin-networks...",
    "basket": [
      {
        "address": "0x7Fc6...",   // Underlying token address
        "symbol": "AAVE",
        "name": "Aave Token",
        "weight": "42.32"         // Percentage of basket
      }
      // ... more tokens
    ],
    "performance": [
      {
        "value": 0.4773,          // Price at timestamp
        "timestamp": 1770836177   // Unix timestamp
      }
      // ... daily price points
    ],
    "brand": {
      "icon": "https://...",      // DTF icon URL
      "cover": "https://...",     // Cover image URL
      "tags": ["DeFi", "Stablecoins"],
      "about": "Description of the DTF strategy and methodology..."
    }
  }
]
```

**Response fields:**

| Field              | Type     | Description                                                   |
|--------------------|----------|---------------------------------------------------------------|
| address            | string   | DTF contract address (checksummed)                            |
| name               | string   | Human-readable DTF name                                       |
| symbol             | string   | Token ticker symbol                                           |
| chainId            | number   | Chain the DTF is deployed on                                  |
| marketCap          | number   | Total market cap in USD                                       |
| price              | number   | Current price per token in USD                                |
| fee                | number   | Annual management fee as a percentage                         |
| mandate            | string   | Governance mandate describing the DTF's investment thesis     |
| basket             | array    | Current basket composition                                    |
| basket[].address   | string   | Underlying token contract address                             |
| basket[].symbol    | string   | Underlying token symbol                                       |
| basket[].name      | string   | Underlying token name                                         |
| basket[].weight    | string   | Percentage weight in the basket (as string)                   |
| performance        | array    | Recent price history (daily data points)                      |
| performance[].value| number   | Price in USD at the given timestamp                           |
| performance[].timestamp | number | Unix timestamp (seconds)                                 |
| brand              | object   | Visual and descriptive metadata                               |
| brand.icon         | string   | URL to DTF icon image                                         |
| brand.cover        | string   | URL to DTF cover image                                        |
| brand.tags         | string[] | Categorization tags (e.g. "DeFi", "Stablecoins", "Majors")   |
| brand.about        | string   | Detailed description of the DTF strategy                      |

### GET /api/zapper/{chainId}/swap

Get a swap quote and unsigned transaction for trading between any pair of tokens. This endpoint handles routing through DEX liquidity pools and can also mint or redeem DTFs as part of the swap path.

**Path parameters:**

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| chainId   | number | Chain ID (1 = Ethereum, 8453 = Base, 56 = BSC) |

**Query parameters:**

| Parameter      | Type    | Required | Description                                                                 |
|----------------|---------|----------|-----------------------------------------------------------------------------|
| chainId        | number  | yes      | Chain ID (must match the path parameter)                                     |
| tokenIn        | address | yes      | Input token contract address                                                 |
| tokenOut       | address | yes      | Output token contract address                                                |
| amountIn       | string  | yes      | Input amount in the token's smallest unit (wei)                              |
| signer         | address | yes      | Address that will execute the transaction                                    |
| slippage       | number  | yes      | Slippage tolerance in basis points (100 = 1%)                                |
| trade          | boolean | no       | `false` for quote only (default), `true` to include execution-ready tx data  |
| skipSimulation | boolean | no       | Skip transaction simulation                                                  |
| bypassCache    | boolean | no       | Force fresh quote, bypassing cache                                           |
| debug          | boolean | no       | Include per-hop price impact breakdown in response                           |

Use `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` as the address for the chain's native token (ETH, BNB, etc.).

**Example — quote swapping 1000 USDC to ETH on Ethereum:**

```bash
curl -s 'https://api.reserve.org/api/zapper/1/swap?chainId=1&tokenIn=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&tokenOut=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&amountIn=1000000000&signer=0x0000000000000000000000000000000000000001&trade=false&slippage=100' \
  | jq '{status, result: (.result | {approvalNeeded, amountInValue, amountOutValue, priceImpact, gas})}'
```

**Response:**

```jsonc
{
  "status": "success",
  "result": {
    "approvalAddress": "0xc2d0...",    // Contract to approve for token spending
    "approvalNeeded": true,            // Whether an ERC20 approve is needed first
    "insufficientFunds": true,         // Whether signer has enough tokenIn balance
    "tokenIn": "0xA0b8...",
    "tokenOut": "0xEeee...",
    "amountIn": "1000000000",          // Input amount (wei)
    "amountOut": "511757021092376090", // Output amount (wei)
    "amountInValue": 1000.52,          // Input value in USD
    "amountOutValue": 998.27,          // Output value in USD
    "minAmountOut": "506639...",        // Minimum output after slippage
    "dust": [],                        // Leftover tokens (see below)
    "dustValue": 0,                    // Total USD value of dust
    "gas": "1147510",                  // Estimated gas units
    "priceImpact": 0.2249,             // Price impact as percentage
    "truePriceImpact": 0.2249,         // True price impact accounting for fees
    "tx": {                            // Unsigned transaction to execute the swap
      "to": "0xc2d0...",
      "data": "0x3a3b...",
      "value": "0"
    }
  },
  "version": "1d05f80",
  "worker": "4645fcac"
}
```

**Dust:** When swapping into a DTF (minting), the swap may produce small leftover amounts of basket tokens that couldn't be fully utilized. These appear in the `dust` array:

```jsonc
{
  "dust": [
    {
      "token": "0xD533...",   // Token contract address
      "symbol": "CRV",
      "amount": "39279..."    // Leftover amount in wei
    }
  ],
  "dustValue": 0.012          // Total dust value in USD
}
```

**Response fields:**

| Field            | Type     | Description                                                        |
|------------------|----------|--------------------------------------------------------------------|
| status           | string   | `"success"` or error status                                        |
| result.approvalAddress | string | Contract address to approve for spending tokenIn              |
| result.approvalNeeded  | boolean | Whether an ERC20 `approve` call is needed before executing   |
| result.insufficientFunds | boolean | Whether the signer has enough tokenIn balance             |
| result.tokenIn   | string   | Input token address                                                |
| result.tokenOut  | string   | Output token address                                               |
| result.amountIn  | string   | Input amount in wei                                                |
| result.amountOut | string   | Expected output amount in wei                                      |
| result.amountInValue  | number | Input value in USD                                              |
| result.amountOutValue | number | Output value in USD                                             |
| result.minAmountOut   | string | Minimum output after slippage tolerance (wei)                   |
| result.dust      | array    | Leftover basket tokens when minting a DTF                          |
| result.dustValue | number   | Total USD value of all dust tokens                                 |
| result.gas       | string   | Estimated gas units for the transaction                            |
| result.priceImpact    | number | Price impact as a percentage                                    |
| result.truePriceImpact | number | Price impact including fees                                    |
| result.tx        | object   | Unsigned transaction (`to`, `data`, `value`)                       |
| version          | string   | API version hash                                                   |
| worker           | string   | Worker instance ID                                                 |

**Debug mode:** When `debug=true`, the response includes `result.debug.priceImpactStats`, an array of per-hop routing details showing the DEX pools used, input/output tokens, amounts, and individual price impacts for each step of the swap path.

### GET /health

Health check endpoint.

**Example:**

```bash
curl -s https://api.reserve.org/health
```

**Response:**

```json
{
  "status": "ok",
  "sha": "c947561f...",
  "env": "production",
  "postgres": true,
  "timestamp": 1771441831251
}
```

## Common Recipes

**List all DTFs on Ethereum with name, symbol, and market cap:**

```bash
curl -s 'https://api.reserve.org/discover/dtf?chainId=1' \
  | jq '.[] | {name, symbol, marketCap}'
```

**Get the basket of a specific DTF by symbol:**

```bash
curl -s 'https://api.reserve.org/discover/dtf?chainId=1' \
  | jq '.[] | select(.symbol == "OPEN") | .basket[] | {symbol, weight}'
```

**Find the highest market-cap DTF across Ethereum and Base:**

```bash
{ curl -s 'https://api.reserve.org/discover/dtf?chainId=1'; curl -s 'https://api.reserve.org/discover/dtf?chainId=8453'; } \
  | jq -s 'add | sort_by(-.marketCap) | .[0] | {name, symbol, chainId, marketCap}'
```

**Get a swap quote for 100 USDC → OPEN DTF on Ethereum:**

```bash
curl -s 'https://api.reserve.org/api/zapper/1/swap?chainId=1&tokenIn=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&tokenOut=0x323c03c48660fe31186fa82c289b0766d331ce21&amountIn=100000000&signer=0x0000000000000000000000000000000000000001&trade=false&slippage=100' \
  | jq '{amountInUSD: .result.amountInValue, amountOutUSD: .result.amountOutValue, priceImpact: .result.priceImpact, gas: .result.gas, dustUSD: .result.dustValue}'
```
