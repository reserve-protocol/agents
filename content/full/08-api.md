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
